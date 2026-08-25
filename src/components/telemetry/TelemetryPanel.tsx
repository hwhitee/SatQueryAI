import { useState } from "react";
import {
  Crosshair,
  Satellite,
  Radio,
  Activity,
  Globe,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BoundingBox, SatelliteSensor } from "@/lib/satquery-types";

interface TelemetryPanelProps {
  center: [number, number];
  zoom: number;
  mousePosition: { lat: number; lng: number } | null;
  roiBounds: BoundingBox | null;
  isAnalyzing: boolean;
  activeAgent: string | null;
}

const SENSORS: SatelliteSensor[] = [
  { name: "Sentinel-2A", gsd: "10 m/px", bands: 13, revisitDays: 5, swathKm: 290 },
  { name: "Landsat-9 OLI", gsd: "30 m/px", bands: 11, revisitDays: 16, swathKm: 185 },
  { name: "Cartosat-3", gsd: "0.3 m/px", bands: 4, revisitDays: 4, swathKm: 13.5 },
];

function DataRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-200/40 last:border-0">
      <span className="text-[10px] uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`text-xs ${mono ? "font-mono" : ""} text-slate-700 font-medium`}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="w-3.5 h-3.5 text-cyan-500" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </span>
    </div>
  );
}

export default function TelemetryPanel({
  center,
  zoom,
  mousePosition,
  roiBounds,
  isAnalyzing,
  activeAgent,
}: TelemetryPanelProps) {
  const sensor = SENSORS[0];
  const [sessionId] = useState(() => Date.now().toString(36).toUpperCase());
  const [mockLatency] = useState(() => Math.floor(40 + Math.random() * 30));

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-y-auto text-sm">
      {/* Mission Header */}
      <div className="text-center pb-3 border-b border-slate-200/50">
        <div className="text-[9px] uppercase tracking-[0.3em] text-cyan-500/80 mb-1">
          SatQueryAI • Geospatial Intelligence
        </div>
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">
          Session Telemetry
        </h2>
        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
          Session {sessionId}
        </div>
      </div>

      {/* Coordinates */}
      <div className="glass-panel p-3 rounded-xl">
        <SectionHeader icon={Crosshair} title="Viewport Center" />
        <DataRow label="Latitude" value={center[0].toFixed(6) + "°"} />
        <DataRow label="Longitude" value={center[1].toFixed(6) + "°"} />
        <DataRow label="Zoom Level" value={`L${zoom}`} />
      </div>

      {/* Mouse Position */}
      <div className="glass-panel p-3 rounded-xl">
        <SectionHeader icon={Globe} title="Cursor Position" />
        {mousePosition ? (
          <>
            <DataRow label="Lat" value={mousePosition.lat.toFixed(6) + "°"} />
            <DataRow label="Lng" value={mousePosition.lng.toFixed(6) + "°"} />
          </>
        ) : (
          <div className="text-[10px] text-slate-400 font-mono py-1">
            Hover over the map to track cursor...
          </div>
        )}
      </div>

      {/* ROI Bounds */}
      <div className="glass-panel p-3 rounded-xl">
        <SectionHeader icon={Waves} title="Region of Interest" />
        {roiBounds ? (
          <>
            <DataRow label="North" value={roiBounds.north.toFixed(4) + "°"} />
            <DataRow label="South" value={roiBounds.south.toFixed(4) + "°"} />
            <DataRow label="East" value={roiBounds.east.toFixed(4) + "°"} />
            <DataRow label="West" value={roiBounds.west.toFixed(4) + "°"} />
            <div className="mt-2 px-2 py-1 rounded-md bg-cyan-50/80 border border-cyan-200/50 text-[10px] font-mono text-cyan-700 text-center">
              ROI ACTIVE — {((roiBounds.north - roiBounds.south) * 111).toFixed(1)} × {((roiBounds.east - roiBounds.west) * 111 * Math.cos((roiBounds.north * Math.PI) / 180)).toFixed(1)} km
            </div>
          </>
        ) : (
          <div className="text-[10px] text-slate-400 font-mono py-1">
            Draw a bounding box on the map...
          </div>
        )}
      </div>

      {/* Sensor Info */}
      <div className="glass-panel p-3 rounded-xl">
        <SectionHeader icon={Satellite} title="Active Sensor" />
        <DataRow label="Sensor" value={sensor.name} />
        <DataRow label="GSD" value={sensor.gsd} />
        <DataRow label="Bands" value={String(sensor.bands)} />
        <DataRow label="Revisit" value={`${sensor.revisitDays}d`} />
        <DataRow label="Swath" value={`${sensor.swathKm} km`} />
      </div>

      {/* Agent Status */}
      <div className="glass-panel p-3 rounded-xl">
        <SectionHeader icon={Radio} title="Agent Status" />
        {isAnalyzing ? (
          <div className="flex items-center gap-2 py-1">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </div>
            <span className="text-[11px] font-mono text-amber-600">
              Processing...
            </span>
          </div>
        ) : activeAgent ? (
          <div className="flex items-center gap-2 py-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono text-slate-600">
              {activeAgent}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1">
            <div className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="text-[11px] font-mono text-slate-400">
              Awaiting input...
            </span>
          </div>
        )}
      </div>

      {/* System Stats */}
      <div className="glass-panel p-3 rounded-xl mt-auto">
        <SectionHeader icon={Activity} title="System" />
        <DataRow label="Status" value="ONLINE" />
        <DataRow label="Latency" value={`${mockLatency}ms`} />
        <DataRow label="Uptime" value="99.97%" />
        <DataRow label="GPU" value="A100 x4" />
      </div>
    </div>
  );
}
