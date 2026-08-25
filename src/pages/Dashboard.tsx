import { useState, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Satellite } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import TelemetryPanel from "@/components/telemetry/TelemetryPanel";
import ChatPanel from "@/components/chat/ChatPanel";
import type { BoundingBox, GeoPoint, GeoPolygon } from "@/lib/satquery-types";

// Dynamic import for Leaflet components (no SSR)
const MapViewer = lazy(() => import("@/components/map/MapViewer"));

function MapFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-mono text-slate-400">Loading satellite imagery...</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [roiBounds, setRoiBounds] = useState<BoundingBox | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5, 78.9]);
  const [mapZoom, setMapZoom] = useState(5);
  const [mousePosition, setMousePosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [geoPoints, setGeoPoints] = useState<GeoPoint[]>([]);
  const [floodPolygon, setFloodPolygon] = useState<GeoPolygon | null>(null);

  const handleBoundsChange = useCallback((bounds: BoundingBox | null) => {
    setRoiBounds(bounds);
  }, []);

  const handleGeoDataReceived = useCallback((points: GeoPoint[], polygon: GeoPolygon | null) => {
    setGeoPoints(points);
    setFloodPolygon(polygon);
  }, []);

  const handleAnalysisStart = useCallback(() => {
    setIsAnalyzing(true);
  }, []);

  const handleAnalysisEnd = useCallback((agentName: string | null) => {
    setIsAnalyzing(false);
    setActiveAgent(agentName);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f0f4f8]">
      {/* Top Bar */}
      <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-sm">
            <Satellite className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none">
              SatQuery AI
            </h1>
            <p className="text-[9px] font-mono text-slate-400 tracking-wider uppercase">
              ISRO Multimodal Remote Sensing Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100/80 border border-slate-200/50">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-slate-500">
              {user?.name || "Analyst"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-1.5 text-slate-500 hover:text-slate-700 h-8"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Exit</span>
          </Button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Telemetry */}
        <aside className="w-[20%] min-w-[240px] max-w-[300px] border-r border-slate-200/60 bg-white/50 backdrop-blur-lg overflow-hidden flex-shrink-0">
          <TelemetryPanel
            center={mapCenter}
            zoom={mapZoom}
            mousePosition={mousePosition}
            roiBounds={roiBounds}
            isAnalyzing={isAnalyzing}
            activeAgent={activeAgent}
          />
        </aside>

        {/* Center Panel — Map */}
        <main className="flex-1 relative bg-slate-100 overflow-hidden">
          <Suspense fallback={<MapFallback />}>
            <MapViewer
              onBoundsChange={handleBoundsChange}
              onZoomChange={setMapZoom}
              onCenterChange={setMapCenter}
              onMousePositionChange={setMousePosition}
              roiBounds={roiBounds}
              geoPoints={geoPoints}
              floodPolygon={floodPolygon}
            />
          </Suspense>
        </main>

        {/* Right Panel — Chat */}
        <aside className="w-[25%] min-w-[300px] max-w-[400px] border-l border-slate-200/60 bg-white/50 backdrop-blur-lg overflow-hidden flex-shrink-0">
          <ChatPanel
            roiBounds={roiBounds}
            onAnalysisStart={handleAnalysisStart}
            onAnalysisEnd={handleAnalysisEnd}
            onGeoDataReceived={handleGeoDataReceived}
          />
        </aside>
      </div>
    </div>
  );
}
