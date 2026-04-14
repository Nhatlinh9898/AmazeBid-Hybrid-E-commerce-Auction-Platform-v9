import {
  canonicalizeProductAnalysis
} from "../canonicalizers/productAnalysisCanonicalizer";
import {
  canonicalizePricingSuggestion
} from "../canonicalizers/pricingCanonicalizer";
import {
  canonicalizeMarketingContent
} from "../canonicalizers/marketingCanonicalizer";
import {
  canonicalizeContent
} from "../canonicalizers/contentCanonicalizer";

export const localAI = {
  async canonicalize(taskType: string, raw: any) {
    switch (taskType) {
      case "PRODUCT_ANALYSIS":
        return canonicalizeProductAnalysis(raw);
      case "PRICING_SUGGESTION":
        return canonicalizePricingSuggestion(raw);
      case "MARKETING_CONTENT":
        return canonicalizeMarketingContent(raw);
      case "CONTENT_CANONICALIZATION":
        return canonicalizeContent(raw);
      case "IMAGE_GENERATION":
      case "VIDEO_GENERATION":
        return { ...raw, canonical_version: "3.0" };
      default:
        throw new Error(`No canonicalizer for task type: ${taskType}`);
    }
  }
};
