export type AgentType = "object-detection" | "change-detection" | "vlm";

export interface AgentInfo {
  type: AgentType;
  name: string;
  badge: string;
  description: string;
}

export const AGENTS: Record<AgentType, AgentInfo> = {
  "object-detection": {
    type: "object-detection",
    name: "YOLO-Geospatial",
    badge: "Object Detection",
    description: "YOLOv8 geospatial inference engine",
  },
  "change-detection": {
    type: "change-detection",
    name: "Siamese-VLM",
    badge: "Change Detection",
    description: "Siamese temporal analysis network",
  },
  vlm: {
    type: "vlm",
    name: "Qwen-VL",
    badge: "Vision-Language",
    description: "Qwen vision-language model",
  },
};

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface GeoPolygon {
  coordinates: GeoPoint[];
  label?: string;
}

export interface AnalysisResult {
  agent: AgentType;
  message: string;
  thinkingSteps: string[];
  geoData?: {
    type: "points" | "polygon";
    points?: GeoPoint[];
    polygon?: GeoPolygon;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: AgentType;
  timestamp: number;
  isThinking?: boolean;
  thinkingStep?: string;
  geoData?: AnalysisResult["geoData"];
}

export interface MapState {
  center: [number, number];
  zoom: number;
  mousePosition: { lat: number; lng: number } | null;
}

export interface SatelliteSensor {
  name: string;
  gsd: string;
  bands: number;
  revisitDays: number;
  swathKm: number;
}
