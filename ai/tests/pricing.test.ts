import { describe, it, expect } from "vitest";
import { canonicalizePricingSuggestion } from "../canonicalizers/pricingCanonicalizer";
import { validatePricing } from "../validators/validatePricing";

describe("Pricing Canonicalizer", () => {
  it("should canonicalize pricing", () => {
    const raw = {
      recommended_price: 150000,
      strategy: "balanced",
      reason: "market average"
    };

    const output = canonicalizePricingSuggestion(raw);

    expect(() => validatePricing(output)).not.toThrow();
    expect(output.price).toBe(150000);
    expect(output.strategy).toBe("BALANCED");
  });
});
