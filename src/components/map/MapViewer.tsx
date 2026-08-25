import { useEffect, useRef, useState, useCallback } from "react";
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
import type {
  BoundingBox,
  GeoPoint,
  GeoPolygon,
  Roi,
  DrawMode,
} from "@/lib/satquery-types";

// Fix Leaflet default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  onRoiChange: (roi: Roi | null) => void;
  onZoomChange: (zoom: number) => void;
  onCenterChange: (center: [number, number]) => void;
  onMousePositionChange: (pos: { lat: number; lng: number } | null) => void;
  roi: Roi | null;
  geoPoints: GeoPoint[];
  floodPolygon: GeoPolygon | null;
}

// ---------------------------------------------------------------------------
// Toolbar: Rectangle draw + Polygon draw + Clear
// ---------------------------------------------------------------------------
function DrawToolbar({
  onModeChange,
  onClear,
}: {
  onModeChange: (mode: DrawMode) => void;
  onClear: () => void;
}) {
  const map = useMap();
  const ctrlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    container.style.cssText =
      "background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.5);border-radius:12px;box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);overflow:hidden;display:flex;flex-direction:column;";

    const makeBtn = (
      title: string,
      svg: string,
      onClick: (e: MouseEvent) => void,
      border = true
    ) => {
      const btn = L.DomUtil.create("a", "", container);
      btn.title = title;
      btn.innerHTML = svg;
      btn.style.cssText = `display:block;width:36px;height:36px;color:#475569;text-decoration:none;cursor:pointer;transition:background 0.15s;${border ? "border-top:1px solid rgba(0,0,0,0.06);" : ""}`;
      btn.onmouseenter = () =>
        (btn.style.background = "rgba(6,214,160,0.15)");
      btn.onmouseleave = () => (btn.style.background = "");
      L.DomEvent.on(btn, "click", (e) => {
        L.DomEvent.stop(e);
        onClick(e as unknown as MouseEvent);
      });
      return btn;
    };

    const rectSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;margin:8px"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 4"/><path d="M9 3v18M3 9h18" stroke-linecap="round"/></svg>`;
    const polySvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;margin:8px"><path d="M12 3l9 5v8l-9 5-9-5V8z" stroke-linejoin="round"/></svg>`;
    const clearSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block;margin:8px"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>`;

    makeBtn("Draw rectangle ROI", rectSvg, () => onModeChange("rectangle"), false);
    makeBtn("Draw polygon ROI", polySvg, () => onModeChange("polygon"));
    makeBtn("Remove ROI", clearSvg, () => onClear());

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    // Create a minimal L.Control wrapper around our container
    const CtrlClass = L.Control.extend({
      options: { position: "topleft" as const },
      onAdd: () => container,
    });
    const ctrl = new CtrlClass();
    ctrl.addTo(map);
    ctrlRef.current = ctrl;

    return () => {
      ctrl.remove();
      ctrlRef.current = null;
    };
  }, [map, onModeChange, onClear]);

  return null;
}

// ---------------------------------------------------------------------------
// Rectangle draw layer
// ---------------------------------------------------------------------------
function RectDrawLayer({
  onRoiChange,
  isActive,
  onComplete,
}: {
  onRoiChange: (r: Roi) => void;
  isActive: boolean;
  onComplete: () => void;
}) {
  const map = useMap();
  const startRef = useRef<L.LatLng | null>(null);
  const rectRef = useRef<L.Rectangle | null>(null);

  useEffect(() => {
    if (!isActive) {
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
        startRef.current = e.latlng;
        const ll: [number, number] = [e.latlng.lat, e.latlng.lng];
        rectRef.current = L.rectangle([ll, ll], {
          color: "#06d6a0",
          weight: 2,
          fillOpacity: 0.1,
          dashArray: "5, 10",
        }).addTo(map);
      } else {
        if (rectRef.current) {
          const b = rectRef.current.getBounds();
          onRoiChange({
            type: "bounding-box",
            bounds: {
              north: b.getNorth(),
              south: b.getSouth(),
              east: b.getEast(),
              west: b.getWest(),
            },
          });
          map.removeLayer(rectRef.current);
          rectRef.current = null;
        }
        startRef.current = null;
        onComplete();
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
        onComplete();
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
  }, [map, isActive, onRoiChange, onComplete]);

  return null;
}

// ---------------------------------------------------------------------------
// Polygon (freeform) draw layer — click to add points, double-click or close to first point to finish
// ---------------------------------------------------------------------------
function PolygonDrawLayer({
  onRoiChange,
  isActive,
  onComplete,
}: {
  onRoiChange: (r: Roi) => void;
  isActive: boolean;
  onComplete: () => void;
}) {
  const map = useMap();
  const pointsRef = useRef<L.LatLng[]>([]);
  const polyRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const previewLineRef = useRef<L.Polyline | null>(null);

  const rebuildPreview = useCallback(
    (cursor: L.LatLng | null) => {
      // Remove old markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      const pts = pointsRef.current;
      if (pts.length === 0) return;

      // Draw vertex markers
      pts.forEach((p, i) => {
        const isFirst = i === 0 && pts.length >= 3;
        const m = L.circleMarker(
          [p.lat, p.lng],
          {
            radius: isFirst ? 7 : 4,
            color: isFirst ? "#06d6a0" : "#06d6a0",
            fillColor: isFirst ? "#ffffff" : "#06d6a0",
            fillOpacity: isFirst ? 1 : 0.7,
            weight: isFirst ? 2.5 : 1.5,
          }
        ).addTo(map);
        markersRef.current.push(m);
      });

      // Draw preview polyline from first point to cursor
      if (previewLineRef.current) {
        map.removeLayer(previewLineRef.current);
      }
      if (cursor && pts.length > 0) {
        const allPts: [number, number][] = [
          ...pts.map((p) => [p.lat, p.lng] as [number, number]),
          [cursor.lat, cursor.lng],
        ];
        previewLineRef.current = L.polyline(allPts, {
          color: "#06d6a0",
          weight: 1.5,
          dashArray: "6, 6",
          interactive: false,
        }).addTo(map);
      }
    },
    [map]
  );

  useEffect(() => {
    if (!isActive) {
      // Cleanup
      if (polyRef.current) {
        map.removeLayer(polyRef.current);
        polyRef.current = null;
      }
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
      if (previewLineRef.current) {
        map.removeLayer(previewLineRef.current);
        previewLineRef.current = null;
      }
      pointsRef.current = [];
      map.getContainer().style.cursor = "";
      return;
    }

    map.getContainer().style.cursor = "crosshair";

    const onClick = (e: L.LeafletMouseEvent) => {
      const pts = pointsRef.current;

      // If we have 3+ points and clicked near the first, close the polygon
      if (pts.length >= 3) {
        const first = pts[0];
        const dist = map.latLngToContainerPoint(first).distanceTo(
          map.latLngToContainerPoint(e.latlng)
        );
        if (dist < 12) {
          finishPolygon();
          return;
        }
      }

      pts.push(e.latlng);
      rebuildPreview(e.latlng);
    };

    const onDblClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stop(e); // prevent second click of double-click from firing
      if (pointsRef.current.length >= 3) {
        // Remove the extra point added by the single-click before dblclick
        pointsRef.current.pop();
        finishPolygon();
      }
    };

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      rebuildPreview(e.latlng);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cleanup();
        onComplete();
      }
    };

    const finishPolygon = () => {
      const pts = pointsRef.current;
      if (pts.length < 3) return;

      // Compute bounding box
      const lats = pts.map((p) => p.lat);
      const lngs = pts.map((p) => p.lng);
      const bounds: BoundingBox = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs),
      };

      const geoPoints: GeoPoint[] = pts.map((p) => ({
        lat: p.lat,
        lng: p.lng,
      }));

      onRoiChange({
        type: "polygon",
        points: geoPoints,
        bounds,
      });

      cleanup();
      onComplete();
    };

    const cleanup = () => {
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
      if (previewLineRef.current) {
        map.removeLayer(previewLineRef.current);
        previewLineRef.current = null;
      }
      pointsRef.current = [];
      map.getContainer().style.cursor = "";
    };

    map.on("click", onClick);
    map.on("dblclick", onDblClick);
    map.on("mousemove", onMouseMove);
    document.addEventListener("keydown", onKey);

    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
      map.off("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKey);
      cleanup();
    };
  }, [map, isActive, onRoiChange, onComplete, rebuildPreview]);

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

// Sync zoom/center to parent
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function MapViewer({
  onRoiChange,
  onZoomChange,
  onCenterChange,
  onMousePositionChange,
  roi,
  geoPoints,
  floodPolygon,
}: MapViewerProps) {
  const center: [number, number] = [20.5, 78.9];
  const [drawMode, setDrawMode] = useState<DrawMode>(null);

  const handleModeChange = (mode: DrawMode) => {
    // Toggle off if clicking the same mode
    setDrawMode((prev) => (prev === mode ? null : mode));
  };
  const handleComplete = () => setDrawMode(null);
  const handleClear = () => {
    onRoiChange(null);
    setDrawMode(null);
  };

  const roiBounds = roi?.bounds ?? null;

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

        <DrawToolbar
          onModeChange={handleModeChange}
          onClear={handleClear}
        />

        <RectDrawLayer
          onRoiChange={onRoiChange}
          isActive={drawMode === "rectangle"}
          onComplete={handleComplete}
        />
        <PolygonDrawLayer
          onRoiChange={onRoiChange}
          isActive={drawMode === "polygon"}
          onComplete={handleComplete}
        />

        <MouseTracker onPositionChange={onMousePositionChange} />
        <ZoomTracker onZoomChange={onZoomChange} onCenterChange={onCenterChange} />

        {/* ROI bounding box outline */}
        {roiBounds && !drawMode && (
          <Rectangle
            bounds={[
              [roiBounds.south, roiBounds.west],
              [roiBounds.north, roiBounds.east],
            ]}
            pathOptions={{
              color: "#06d6a0",
              weight: 1.5,
              fillOpacity: 0.04,
              dashArray: "8, 6",
              interactive: false,
            }}
          />
        )}

        {/* Polygon ROI shape */}
        {roi?.type === "polygon" && !drawMode && (
          <Polygon
            positions={roi.points.map((c) => [c.lat, c.lng])}
            pathOptions={{
              color: "#06d6a0",
              weight: 2,
              fillOpacity: 0.1,
              dashArray: "6, 4",
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

      {/* Drawing mode hint — rectangle */}
      {drawMode === "rectangle" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="glass-card px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-600">
              Click to set the first corner, move, then click again to finish — press <strong className="text-slate-800">Esc</strong> to cancel
            </span>
          </div>
        </div>
      )}

      {/* Drawing mode hint — polygon */}
      {drawMode === "polygon" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="glass-card px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-600">
              Click to add points, <strong className="text-slate-800">double-click</strong> or click the first point to close — press <strong className="text-slate-800">Esc</strong> to cancel
            </span>
          </div>
        </div>
      )}

      {/* ROI hint — idle */}
      {!roi && !drawMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none animate-pulse">
          <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500 flex-shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 4" />
              <path d="M9 3v18M3 9h18" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-mono text-slate-600">
              Use the <strong className="text-cyan-600">toolbar</strong> to draw a rectangle or polygon ROI on the map
            </span>
          </div>
        </div>
      )}

      {/* ROI locked */}
      {roi && !drawMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="glass-card px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono text-slate-600">
              ROI locked ({roi.type === "polygon" ? "polygon" : "rectangle"}) — enter a query in the chat panel
            </span>
          </div>
        </div>
      )}

      {/* Bottom label */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-none">
        <div className="glass-panel px-3 py-1.5 text-[10px] font-mono tracking-wider text-slate-500/80 uppercase">
          OpenStreetMap • SatQueryAI Analysis Mode
        </div>
      </div>
    </div>
  );
}
