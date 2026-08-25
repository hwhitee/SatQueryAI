import type {
  AnalysisResult,
  AgentType,
  BoundingBox,
  GeoPoint,
} from "./satquery-types";

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generatePointsInBounds(
  bounds: BoundingBox,
  count: number,
): GeoPoint[] {
  const points: GeoPoint[] = [];
  const latRange = bounds.north - bounds.south;
  const lngRange = bounds.east - bounds.west;
  for (let i = 0; i < count; i++) {
    points.push({
      lat: bounds.south + randomInRange(0.05, 0.95) * latRange,
      lng: bounds.west + randomInRange(0.05, 0.95) * lngRange,
      label: `Structure ${i + 1}`,
    });
  }
  return points;
}

function generateFloodPolygon(bounds: BoundingBox): GeoPoint[] {
  const latRange = bounds.north - bounds.south;
  const lngRange = bounds.east - bounds.west;
  const cx = (bounds.north + bounds.south) / 2;
  const cy = (bounds.east + bounds.west) / 2;
  const rLat = latRange * 0.35;
  const rLng = lngRange * 0.35;
  const points: GeoPoint[] = [];
  const sides = 8;
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides;
    const jitterLat = randomInRange(0.85, 1.15);
    const jitterLng = randomInRange(0.85, 1.15);
    points.push({
      lat: cx + rLat * Math.cos(angle) * jitterLat,
      lng: cy + rLng * Math.sin(angle) * jitterLng,
    });
  }
  return points;
}

function detectAgent(
  query: string,
): { agent: AgentType; thinkingSteps: string[] } {
  const q = query.toLowerCase();
  if (
    q.includes("building") ||
    q.includes("count") ||
    q.includes("house") ||
    q.includes("structure") ||
    q.includes("detect")
  ) {
    return {
      agent: "object-detection",
      thinkingSteps: [
        "Dispatching to YOLO-Geospatial agent...",
        "Clipping satellite tiles to bounding box...",
        "Running inference on 512×512 patches...",
        "Aggregating detections across tiles...",
        "Generating GeoJSON point features...",
      ],
    };
  }
  if (
    q.includes("flood") ||
    q.includes("change") ||
    q.includes("water") ||
    q.includes("before") ||
    q.includes("after") ||
    q.includes("compare") ||
    q.includes("monsoon") ||
    q.includes("temporal")
  ) {
    return {
      agent: "change-detection",
      thinkingSteps: [
        "Dispatching to Siamese change-detection agent...",
        "Fetching pre-event reference tiles...",
        "Fetching post-event analysis tiles...",
        "Computing spectral difference map...",
        "Segmenting water body polygons...",
      ],
    };
  }
  return {
    agent: "vlm",
    thinkingSteps: [
      "Dispatching to Qwen vision-language agent...",
      "Extracting multispectral bands for ROI...",
      "Computing NDVI and spectral indices...",
      "Generating terrain classification...",
    ],
  };
}

function buildObjectDetectionResponse(
  bounds: BoundingBox,
): AnalysisResult {
  const count = Math.floor(randomInRange(28, 58));
  return {
    agent: "object-detection",
    message: `Object Detection agent completed. **${count} structures** identified within the selected Region of Interest.\n\nConfidence threshold: 0.72. All detections above 70% have been mapped to GeoJSON point features and are visible on the map.`,
    thinkingSteps: [],
    geoData: {
      type: "points",
      points: generatePointsInBounds(bounds, count),
    },
  };
}

function buildChangeDetectionResponse(
  bounds: BoundingBox,
): AnalysisResult {
  return {
    agent: "change-detection",
    message:
      "Change-Detection agent completed. Comparing pre-event and post-event multispectral imagery.\n\n**Analysis:** A water body expansion of approximately 34% has been detected within the ROI. The Siamese network identified flooded regions by computing spectral divergence between T\u2081 (Jan 2024) and T\u2082 (Aug 2024) imagery. The blue overlay on the map represents the classified flood extent polygon.",
    thinkingSteps: [],
    geoData: {
      type: "polygon",
      polygon: {
        coordinates: generateFloodPolygon(bounds),
        label: "Flood Extent (34% expansion)",
      },
    },
  };
}

function buildVLMResponse(): AnalysisResult {
  const terrainTypes = [
    "mixed agricultural land with sparse vegetation cover",
    "urban fringe area with residential clusters and barren patches",
    "semi-arid terrain with scrubland and seasonal water channels",
    "irrigated farmland with active cultivation and tree cover",
    "peri-urban transition zone with construction activity",
    "dry deciduous forest edge with rocky outcrops",
  ];
  const terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
  return {
    agent: "vlm",
    message: `Vision-Language agent completed.\n\n**Terrain Analysis:** This region consists of ${terrain}.\n\nThe model processed the multispectral composite (Bands 4, 3, 2 — true color) and generated a land-use classification. No anomalous features or significant land-use changes were detected within the analysis window.`,
    thinkingSteps: [],
  };
}

export async function analyzeQuery(
  query: string,
  bounds: BoundingBox | null,
): Promise<AnalysisResult> {
  // Simulate network + inference latency
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 1200));

  const { agent } = detectAgent(query);
  const fallbackBounds: BoundingBox = {
    north: 28.7,
    south: 28.5,
    east: 77.3,
    west: 77.1,
  };
  const b = bounds ?? fallbackBounds;

  switch (agent) {
    case "object-detection":
      return buildObjectDetectionResponse(b);
    case "change-detection":
      return buildChangeDetectionResponse(b);
    default:
      return buildVLMResponse();
  }
}

export function getThinkingSteps(query: string): string[] {
  return detectAgent(query).thinkingSteps;
}

export function getAgentForQuery(
  query: string,
): AgentType {
  return detectAgent(query).agent;
}
