import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  Satellite,
  Map,
  Brain,
  Layers,
  ArrowRight,
  Shield,
  Globe,
  ChevronRight,
  Box,
  Activity,
  CheckCircle2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Box,
    title: "Draw and Query",
    desc: "Define any Region of Interest on a satellite map and ask natural language questions about that area — no GIS expertise required.",
  },
  {
    icon: Brain,
    title: "Multi-Agent Intelligence",
    desc: "Queries are automatically routed to specialized AI models for object detection, change analysis, or terrain classification.",
  },
  {
    icon: Layers,
    title: "Geospatial Overlays",
    desc: "Results are rendered as interactive map layers — detection points, flood extent polygons, and spectral classification data.",
  },
  {
    icon: Activity,
    title: "Live Telemetry Dashboard",
    desc: "Viewport coordinates, sensor metadata, agent processing status, and session analytics displayed in real time.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Define the Region",
    desc: "Draw a bounding box on the satellite map to select your area of interest.",
    icon: Map,
  },
  {
    step: "02",
    title: "Ask in Plain Language",
    desc: "Type questions about the region using everyday language — the system handles the rest.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Review the Analysis",
    desc: "Receive AI-powered insights overlaid directly on the map with full supporting metadata.",
    icon: Layers,
  },
];

const CAPABILITIES = [
  "Structure detection and counting",
  "Flood and water body analysis",
  "Terrain and land-use classification",
  "Multi-spectral band processing",
  "Temporal change detection",
  "Real-time GeoJSON export",
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth?returnTo=/dashboard");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-[#f0f6ff] via-[#f5f7fa] to-[#eef2ff]">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-200/30 to-blue-200/20 blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-100/30 to-violet-100/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-100/20 to-cyan-100/20 blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20">
            <Satellite className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold text-slate-800 tracking-tight">
            SatQuery<span className="text-cyan-600">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCTA}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 flex items-center gap-1.5"
          >
            {isAuthenticated ? "Open Platform" : "Request Access"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-cyan-200/50 text-[11px] font-semibold text-cyan-700 uppercase tracking-widest mb-6 shadow-sm">
            <Shield className="w-3 h-3" />
            Enterprise Geospatial Intelligence
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl"
        >
          Satellite Analysis{" "}
          <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            as a Conversation
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 text-base sm:text-lg text-slate-500 max-w-2xl leading-relaxed"
        >
          Select any region on Earth. Ask a question in plain language. Receive
          instant analysis powered by specialized geospatial AI models — built for
          teams that need answers, not pipelines.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3"
        >
          <button
            onClick={handleCTA}
            className="group px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 flex items-center gap-2"
          >
            Open the Platform
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-mono">No API keys required</span>
          </div>
        </motion.div>

        {/* Hero visual — mock dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 w-full max-w-5xl"
        >
          <div className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl shadow-2xl shadow-slate-300/30 p-1 overflow-hidden">
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 h-48 sm:h-64 lg:h-80 flex items-center justify-center relative overflow-hidden">
              {/* Mock 3-column layout */}
              <div className="flex w-full h-full p-3 gap-3">
                {/* Left mock */}
                <div className="w-[20%] rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200/40 p-2 space-y-1.5">
                  <div className="h-2 w-16 rounded bg-cyan-200/60" />
                  <div className="h-1.5 w-12 rounded bg-slate-200/60" />
                  <div className="h-1.5 w-14 rounded bg-slate-200/50" />
                  <div className="h-1.5 w-10 rounded bg-slate-200/40" />
                  <div className="mt-2 h-2 w-16 rounded bg-cyan-200/60" />
                  <div className="h-1.5 w-12 rounded bg-slate-200/60" />
                  <div className="h-1.5 w-14 rounded bg-slate-200/50" />
                </div>
                {/* Center mock — map */}
                <div className="flex-1 rounded-lg bg-gradient-to-br from-blue-100/40 to-green-100/30 border border-slate-200/40 relative flex items-center justify-center">
                  <Map className="w-12 h-12 text-cyan-400/40" />
                  <div className="absolute inset-4 border-2 border-dashed border-cyan-400/40 rounded-lg" />
                  <div className="absolute top-3 right-3 px-2 py-1 rounded bg-white/60 backdrop-blur text-[8px] font-mono text-slate-500">
                    ROI ACTIVE
                  </div>
                </div>
                {/* Right mock — chat */}
                <div className="w-[25%] rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200/40 p-2 space-y-2">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <div className="h-1.5 w-14 rounded bg-slate-200/60" />
                  </div>
                  <div className="h-1.5 w-20 rounded bg-slate-200/40" />
                  <div className="h-1.5 w-16 rounded bg-slate-200/30" />
                  <div className="mt-1 h-2.5 w-24 rounded bg-cyan-100/60" />
                  <div className="h-2.5 w-20 rounded bg-cyan-100/50" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Three steps to insight
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-lg mx-auto">
              From raw satellite imagery to actionable intelligence in under a minute.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 text-cyan-600 mb-4 shadow-sm">
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-mono text-cyan-500 font-bold uppercase tracking-widest mb-2">
                  Step {s.step}
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features + Capabilities */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Built for geospatial teams
            </h2>
            <p className="mt-3 text-sm text-slate-500 max-w-lg mx-auto">
              A purpose-built agentic architecture that turns satellite imagery into structured, queryable intelligence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6 flex gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center text-cyan-600 shadow-sm">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1">{f.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-slate-800 mb-3">Supported analyses</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CAPABILITIES.map((cap) => (
                <div key={cap} className="flex items-center gap-2 text-[13px] text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                  {cap}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto glass-card rounded-3xl p-10 text-center"
        >
          <Globe className="w-10 h-10 text-cyan-500 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-3">
            Ready to get started?
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Select a region, ask a question, and receive structured geospatial
            analysis powered by specialized AI models.
          </p>
          <button
            onClick={handleCTA}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25 transition-all duration-300"
          >
            Open SatQueryAI
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-semibold text-slate-600">
              SatQuery<span className="text-cyan-600">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v1.0</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Geospatial Intelligence Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
