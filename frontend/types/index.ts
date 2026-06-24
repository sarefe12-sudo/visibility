export interface PromptWithTrend {
  prompt: string;
  trend_score: number;
}

export interface Competitor {
  name: string;
  website?: string;
}

export interface ModelResponse {
  response: string;
  mentions: Record<string, number>;
}

export interface MultiModelPromptResult {
  prompt: string;
  model_responses: Record<string, ModelResponse>;
}

export interface CompetitorScore {
  overall: number;
  per_model: Record<string, number>;
}

export interface AnalyzeResponse {
  brand: string;
  overall_score: number;
  model_scores: Record<string, number>;
  competitor_scores: Record<string, CompetitorScore>;
  insights: string[];
  active_models: string[];
  raw_results: MultiModelPromptResult[];
}
