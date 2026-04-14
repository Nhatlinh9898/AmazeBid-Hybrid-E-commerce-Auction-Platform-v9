import { AITaskType } from "@prisma/client";
import { productAnalysisTask } from "../tasks/productAnalysis";
import { pricingSuggestionTask } from "../tasks/pricingSuggestion";
import { marketingContentTask } from "../tasks/marketingContent";
import { canonicalizationTask } from "../tasks/contentCanonicalization";
import { imageGenerationTask } from "../tasks/imageGeneration";
import { videoGenerationTask } from "../tasks/videoGeneration";

export const taskRegistry: Record<AITaskType, (input: any) => Promise<{ rawOutput: any, finalOutput: any }>> = {
  [AITaskType.PRODUCT_ANALYSIS]: productAnalysisTask,
  [AITaskType.PRICING_SUGGESTION]: pricingSuggestionTask,
  [AITaskType.MARKETING_CONTENT]: marketingContentTask,
  [AITaskType.CONTENT_CANONICALIZATION]: canonicalizationTask,
  [AITaskType.IMAGE_GENERATION]: imageGenerationTask,
  [AITaskType.VIDEO_GENERATION]: videoGenerationTask,
  [AITaskType.SEO_KEYWORD_EXTRACTION]: async () => ({ rawOutput: null, finalOutput: null }),
  [AITaskType.PRODUCT_TITLE_REWRITE]: async () => ({ rawOutput: null, finalOutput: null }),
  [AITaskType.PRODUCT_DESCRIPTION_REWRITE]: async () => ({ rawOutput: null, finalOutput: null }),
};
