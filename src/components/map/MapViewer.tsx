import { useEffect, useRef, useCallback, useState } from "react";
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
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
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

// Inner component that handles draw controls
function DrawController({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: BoundingBox | null) => void;
}) {
  const map = useMap();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    const LDrawControl = (L as any).Control?.Draw;
    if (!LDrawControl) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    const drawControl = new LDrawControl({
      position: "topleft",
      draw: {
        rectangle: {
          shapeOptions: {
            color: "#06d6a0",
            weight: 2,
            fillOpacity: 0.1,
            dashArray: "5, 10",
          },
        },
        polyline: false,
        polygon: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    const CREATED = "draw:created";
    const DELETED = "draw:deleted";

    const handleDrawCreated = (e: any) => {
      const layer = e.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);
      const bounds = layer.getBounds();
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };

    const handleDrawDeleted = () => {
      onBoundsChange(null);
    };

    map.on(CREATED, handleDrawCreated);
    map.on(DELETED, handleDrawDeleted);

    return () => {
      map.off(CREATED, handleDrawCreated);
      map.off(DELETED, handleDrawDeleted);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onBoundsChange]);

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
        <DrawController onBoundsChange={onBoundsChange} />
        <MouseTracker onPositionChange={onMousePositionChange} />
        <ZoomTracker
          onZoomChange={onZoomChange}
          onCenterChange={onCenterChange}
        />

        {/* ROI bounding box */}
        {roiBounds && (
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

      {/* ROI hint — only shown when no ROI is drawn */}
      {!roiBounds && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none animate-pulse">
          <div className="glass-card px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500 flex-shrink-0">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 4" />
              <path d="M9 3v18M3 9h18" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-mono text-slate-600">
              Click the <strong className="text-cyan-600">rectangle icon</strong> in the top-left toolbar, then drag on the map to draw a Region of Interest
            </span>
          </div>
        </div>
      )}

      {/* ROI locked indicator */}
      {roiBounds && (
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
