import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, BoundingBox } from "@/lib/satquery-types";
import { AGENTS, type AgentType } from "@/lib/satquery-types";
import { analyzeQuery, getThinkingSteps, getAgentForQuery } from "@/lib/analyze";

interface ChatPanelProps {
  roiBounds: BoundingBox | null;
  onAnalysisStart: () => void;
  onAnalysisEnd: (agentName: string | null) => void;
  onGeoDataReceived: (points: any[], polygon: any | null) => void;
}

function ThinkingStep({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-[11px] font-mono text-cyan-500/80">
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>{text}</span>
    </div>
  );
}

function AgentBadge({ agent }: { agent: AgentType }) {
  const info = AGENTS[agent];
  const colors: Record<AgentType, string> = {
    "object-detection": "bg-rose-100 text-rose-600 border-rose-200",
    "change-detection": "bg-blue-100 text-blue-600 border-blue-200",
    vlm: "bg-violet-100 text-violet-600 border-violet-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider border",
        colors[agent]
      )}
    >
      {info.badge}
    </span>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5 py-2", isUser ? "flex-row-reverse" : "")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs",
          isUser
            ? "bg-slate-200/80 text-slate-600"
            : "bg-gradient-to-br from-cyan-100 to-blue-100 text-cyan-700"
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col gap-1 max-w-[85%]", isUser ? "items-end" : "")}>
        {/* Name + badge row */}
        <div className={cn("flex items-center gap-1.5", isUser ? "flex-row-reverse" : "")}>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            {isUser ? "Analyst" : "SatQuery AI"}
          </span>
          {!isUser && message.agent && <AgentBadge agent={message.agent} />}
        </div>

        {/* Message */}
        <div
          className={cn(
            "rounded-xl px-3 py-2 text-[13px] leading-relaxed",
            isUser
              ? "bg-slate-800 text-white rounded-tr-sm"
              : "bg-white/70 text-slate-700 border border-slate-200/60 rounded-tl-sm backdrop-blur-sm"
          )}
        >
          {message.isThinking ? (
            <div className="space-y-0.5">
              {message.thinkingStep && <ThinkingStep text={message.thinkingStep} />}
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed">
              {message.content.split("\n").map((line, i) => {
                // Simple bold rendering
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return (
                  <div key={i} className="py-0.5">
                    {parts.map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j} className={isUser ? "text-white" : "text-slate-900"}>
                          {part}
                        </strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[9px] font-mono text-slate-400 px-1">
          {new Date(message.timestamp).toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

export default function ChatPanel({
  roiBounds,
  onAnalysisStart,
  onAnalysisEnd,
  onGeoDataReceived,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "SatQuery AI ready. Draw a Region of Interest on the map and ask me anything about that area.\n\n**Try asking:**\n• \"Count the buildings here\"\n• \"Detect flood changes\"\n• \"What terrain is this?\"",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const query = input.trim();
      if (!query || isProcessing) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsProcessing(true);
      onAnalysisStart();

      const agent = getAgentForQuery(query);
      const thinkingSteps = getThinkingSteps(query);

      // Show thinking steps one by one
      for (let i = 0; i < thinkingSteps.length; i++) {
        const thinkMsg: ChatMessage = {
          id: `think-${Date.now()}-${i}`,
          role: "assistant",
          content: "",
          agent,
          timestamp: Date.now(),
          isThinking: true,
          thinkingStep: thinkingSteps[i],
        };
        setMessages((prev) => [...prev, thinkMsg]);
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
      }

      // Remove thinking messages and add final response
      const result = await analyzeQuery(query, roiBounds);

      setMessages((prev) => {
        const withoutThinking = prev.filter((m) => !m.isThinking);
        return [
          ...withoutThinking,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: result.message,
            agent: result.agent,
            timestamp: Date.now(),
            geoData: result.geoData,
          },
        ];
      });

      // Send geo data to map
      if (result.geoData) {
        onGeoDataReceived(
          result.geoData.type === "points" ? result.geoData.points || [] : [],
          result.geoData.type === "polygon" ? result.geoData.polygon || null : null
        );
      }

      const agentNames: Record<AgentType, string> = {
        "object-detection": "YOLO-Geospatial",
        "change-detection": "Siamese-VLM",
        vlm: "Qwen-VL",
      };
      onAnalysisEnd(agentNames[agent] || null);
      setIsProcessing(false);
    },
    [input, isProcessing, roiBounds, onAnalysisStart, onAnalysisEnd, onGeoDataReceived]
  );

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared. Ready for new analysis.",
        timestamp: Date.now(),
      },
    ]);
    onGeoDataReceived([], null);
    onAnalysisEnd(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            AI Terminal
          </span>
        </div>
        <button
          onClick={clearChat}
          className="p-1.5 rounded-lg hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 transition-colors"
          title="Clear chat"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ROI indicator */}
      {roiBounds && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-cyan-50/80 border border-cyan-200/50 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] font-mono text-cyan-600">
            ROI LOCKED — [{roiBounds.south.toFixed(3)}, {roiBounds.west.toFixed(3)}] → [{roiBounds.north.toFixed(3)}, {roiBounds.east.toFixed(3)}]
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scroll-smooth"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-slate-200/50">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-mono text-xs font-bold">
              &gt;
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={roiBounds ? "Ask about this region..." : "Draw ROI first, then ask..."}
              disabled={isProcessing}
              className={cn(
                "w-full pl-8 pr-3 py-2.5 rounded-xl text-[13px] font-mono",
                "bg-white/60 border border-slate-200/60 backdrop-blur-sm",
                "focus:outline-none focus:ring-2 focus:ring-cyan-300/50 focus:border-cyan-300",
                "placeholder:text-slate-400 text-slate-700",
                "transition-all duration-200",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-200",
              "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
              "hover:from-cyan-600 hover:to-blue-600",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              "shadow-sm hover:shadow-md"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
