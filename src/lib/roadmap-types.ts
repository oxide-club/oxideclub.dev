export type MaterialRef =
  `challenges:${string}` | `labs:${string}` | `notes:${string}`;
export type RoadmapEdge = {
  from: MaterialRef;
  to: MaterialRef;
  type: 'recommended_next' | 'suggested_preparation' | 'branch' | 'convergence';
  label?: string;
};
export interface RoadmapData {
  version: 1;
  title: string;
  summary: string;
  question: string;
  audience: string;
  prerequisites: string[];
  learningGoals: string[];
  draft: boolean;
  publishedAt?: string;
  updatedAt?: string;
  order: number;
  featured?: boolean;
  nodes: { ref: MaterialRef; context?: string; relatedRoadmap?: string }[];
  edges: RoadmapEdge[];
  layout?: { primaryPath?: MaterialRef[]; branchOrder?: MaterialRef[] };
  groups?: { title: string; nodes: MaterialRef[] }[];
}
export interface RoadmapNode {
  ref: MaterialRef;
  id: string;
  type: 'challenges' | 'labs' | 'notes';
  title: string;
  summary: string;
  url: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  context?: string;
  relatedRoadmap?: string;
}
type Point = { x: number; y: number };
export interface RoadmapLayout {
  width: number;
  height: number;
  nodes: { ref: string; x: number; y: number; width: number; height: number }[];
  edges: {
    from: string;
    to: string;
    type: string;
    label?: string;
    sections: { startPoint: Point; endPoint: Point; bendPoints?: Point[] }[];
    labels: { x: number; y: number; width: number; height: number }[];
  }[];
}
