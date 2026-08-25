import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Rectangle,
  Polygon,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { BoundingBox, GeoPoint, GeoPolygon } from "@/lib/satquery-types";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapViewerProps {
  onBoundsChange: (bounds: BoundingBox | null) => void;
  onZoomChange: (zoom: number) => void;
  onCenterChange: (center: [number, number]) => void;
  onMousePositionChange: (pos: { lat: number; lng: number } | null) => void;
  roiBounds: BoundingBox | null;
  geoPoints: GeoPoint[];
  floodPolygon: GeoPolygon | null;
}

/** Custom L.Draw-compatible control that avoids the buggy leaflet-draw plugin */
function DrawButton({ onDrawStart, onClear, isDrawing }: {
  onDrawStart: () => void;
  onClear: () => void;
  isDrawing: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const Control = L.Control.extend({
      options: { position: "topleft" as const },
      onAdd() {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control"
        );
        container.style.cssText =
          "background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.5);border-radius:12px;box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);overflow:hidden;";

        // Draw button
        const drawBtn = L.DomUtil.create(
          "a",
          "",
          container
        );
        drawBtn.title = "Draw Region of Interest";
        drawBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;margin:8px"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 4"/><path d="M9 3v18M3 9h18" stroke-linecap="round"/></svg>`;
        drawBtn.style.cssText =
          "display:block;width:36px;height:36px;color:#475569;text-decoration:none;cursor:pointer;transition:background 0.15s;";
        drawBtn.onmouseenter = () =>
          (drawBtn.style.background = "rgba(6,214,160,0.15)");
        drawBtn.onmouseleave = () => (drawBtn.style.background = "");
        L.DomEvent.on(drawBtn, "click", (e) => {
          L.DomEvent.stop(e);
          onDrawStart();
        });

        // Clear button
        const clearBtn = L.DomUtil.create("a", "", container);
        clearBtn.title = "Remove Region of Interest";
        clearBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;margin:8px"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>`;
        clearBtn.style.cssText =
          "display:block;width:36px;height:36px;color:#475569;text-decoration:none;cursor:pointer;border-top:1px solid rgba(0,0,0,0.06);transition:background 0.15s;";
        clearBtn.onmouseenter = () =>
          (clearBtn.style.background = "rgba(239,68,68,0.1)");
        clearBtn.onmouseleave = () => (clearBtn.style.background = "");
        L.DomEvent.on(clearBtn, "click", (e) => {
          L.DomEvent.stop(e);
          onClear();
        });

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
      },
    });

    const ctrl = new Control();
    ctrl.addTo(map);
    return () => {
      ctrl.remove();
    };
  }, [map, onDrawStart, onClear]);

  return null;
}

/**
 * Interactive rectangle drawing layer.
 * Click to set the first corner, move the mouse, click again to finalize.
 */
function RectDrawLayer({
  onBoundsChange,
  isDrawing,
  onDrawComplete,
}: {
  onBoundsChange: (b: BoundingBox | null) => void;
  isDrawing: boolean;
  onDrawComplete: () => void;
}) {
  const map = useMap();
  const startRef = useRef<L.LatLng | null>(null);
  const rectRef = useRef<L.Rectangle | null>(null);

  useEffect(() => {
    if (!isDrawing) {
      // clean up any in-progress rectangle
      if (rectRef.current) {
        map.removeLayer(rectRef.current);
        rectRef.current = null;
      }
      startRef.current = null;
      map.getContainer().style.cursor = "";
      return;
    }

    map.getContainer().style.cursor = "crosshair";

    const onClick = (e: L.LeafletMouseEvent) => {
      if (!startRef.current) {
        // First click — set start corner
        startRef.current = e.latlng;
        const ll: [number, number] = [e.latlng.lat, e.latlng.lng];
        rectRef.current = L.rectangle(
          [ll, ll],
          {
            color: "#06d6a0",
            weight: 2,
            fillOpacity: 0.1,
            dashArray: "5, 10",
          }
        ).addTo(map);
      } else {
        // Second click — finalize
        if (rectRef.current) {
          const bounds = rectRef.current.getBounds();
          onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          });
          map.removeLayer(rectRef.current);
          rectRef.current = null;
        }
        startRef.current = null;
        onDrawComplete();
      }
    };

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (startRef.current && rectRef.current) {
        rectRef.current.setBounds([
          [startRef.current.lat, startRef.current.lng],
          [e.latlng.lat, e.latlng.lng],
        ]);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (rectRef.current) {
          map.removeLayer(rectRef.current);
          rectRef.current = null;
        }
        startRef.current = null;
        onDrawComplete();
      }
    };

    map.on("click", onClick);
    map.on("mousemove", onMouseMove);
    document.addEventListener("keydown", onKey);

    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKey);
      if (rectRef.current) {
        map.removeLayer(rectRef.current);
        rectRef.current = null;
      }
      startRef.current = null;
      map.getContainer().style.cursor = "";
    };
  }, [map, isDrawing, onBoundsChange, onDrawComplete]);

  return null;
}

// Mouse position tracker
function MouseTracker({
  onPositionChange,
}: {
  onPositionChange: (pos: { lat: number; lng: number } | null) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const handler = (e: L.LeafletMouseEvent) => {
      onPositionChange({
        lat: parseFloat(e.latlng.lat.toFixed(6)),
        lng: parseFloat(e.latlng.lng.toFixed(6)),
      });
    };
    const leaveHandler = () => onPositionChange(null);
    map.on("mousemove", handler);
    map.on("mouseout", leaveHandler);
    return () => {
      map.off("mousemove", handler);
      map.off("mouseout", leaveHandler);
    };
  }, [map, onPositionChange]);
  return null;
}

// Sync zoom level to parent
function ZoomTracker({
  onZoomChange,
  onCenterChange,
}: {
  onZoomChange: (z: number) => void;
  onCenterChange: (c: [number, number]) => void;
}) {
  const map = useMap();
  useEffect(() => {
    onZoomChange(map.getZoom());
    const c = map.getCenter();
    onCenterChange([c.lat, c.lng]);
    const onMove = () => {
      onZoomChange(map.getZoom());
      const cc = map.getCenter();
      onCenterChange([cc.lat, cc.lng]);
    };
    map.on("moveend", onMove);
    map.on("zoomend", onMove);
    return () => {
      map.off("moveend", onMove);
      map.off("zoomend", onMove);
    };
  }, [map, onZoomChange, onCenterChange]);
  return null;
}

export default function MapViewer({
  onBoundsChange,
  onZoomChange,
  onCenterChange,
  onMousePositionChange,
  roiBounds,
  geoPoints,
  floodPolygon,
}: MapViewerProps) {
  const center: [number, number] = [20.5, 78.9]; // Center of India
  const [isDrawing, setIsDrawing] = useState(false);

  const handleDrawStart = () => setIsDrawing(true);
  const handleDrawComplete = () => setIsDrawing(false);
  const handleClear = () => {
    onBoundsChange(null);
    setIsDrawing(false);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={5}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        />
        <DrawButton
          onDrawStart={handleDrawStart}
          onClear={handleClear}
          isDrawing={isDrawing}
        />
        <RectDrawLayer
          onBoundsChange={onBoundsChange}
          isDrawing={isDrawing}
          onDrawComplete={handleDrawComplete}
        />
        <MouseTracker onPositionChange={onMousePositionChange} />
        <ZoomTracker
          onZoomChange={onZoomChange}
          onCenterChange={onCenterChange}
        />

        {/* ROI bounding box */}
        {roiBounds && !isDrawing && (
          <Rectangle
            bounds={[
              [roiBounds.south, roiBounds.west],
              [roiBounds.north, roiBounds.east],
            ]}
            pathOptions={{
              color: "#06d6a0",
              weight: 2,
              fillOpacity: 0.08,
              dashArray: "8, 6",
            }}
          />
        )}

        {/* Object detection points */}
        {geoPoints.map((pt, i) => (
          <CircleMarker
            key={`pt-${i}`}
            center={[pt.lat, pt.lng]}
            radius={5}
            pathOptions={{
              color: "#ef4444",
              fillColor: "#ef4444",
              fillOpacity: 0.8,
              weight: 1.5,
            }}
          >
            <Tooltip permanent={false} direction="top" offset={[0, -8]}>
              <span className="text-xs">{pt.label}</span>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Flood polygon */}
        {floodPolygon && (
          <Polygon
            positions={floodPolygon.coordinates.map((c) => [c.lat, c.lng])}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.25,
              weight: 2,
              dashArray: "4, 4",
            }}
          >
            <Tooltip>
              <span className="text-xs">{floodPolygon.label}</span>
            </Tooltip>
          </Polygon>
        )}
      </MapContainer>

      {/* Drawing mode hint */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="glass-card px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-600">
              Click to set the first corner, move, then click again to finish — press <strong className="text-slate-800">Esc</strong> to cancel
            </span>
          </div>
        </div>
      )}

      {/* ROI hint — only shown when no ROI is drawn */}
      {!roiBounds && !isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none animate-pulse">
          <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500 flex-shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 4" />
              <path d="M9 3v18M3 9h18" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-mono text-slate-600">
              Click the <strong className="text-cyan-600">draw icon</strong> in the top-left toolbar, then click two corners on the map to define a Region of Interest
            </span>
          </div>
        </div>
      )}

      {/* ROI locked indicator */}
      {roiBounds && !isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="glass-card px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono text-slate-600">
              ROI locked — enter a query in the chat panel
            </span>
          </div>
        </div>
      )}

      {/* Map overlay label */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
        <div className="glass-panel px-3 py-1.5 text-[10px] font-mono tracking-wider text-slate-500/80 uppercase">
          OpenStreetMap • SatQueryAI Analysis Mode
        </div>
      </div>
    </div>
  );
}
