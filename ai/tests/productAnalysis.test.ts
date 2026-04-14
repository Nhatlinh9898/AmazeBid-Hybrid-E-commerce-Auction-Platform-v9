import { describe, it, expect } from "vitest";
import { canonicalizeProductAnalysis } from "../canonicalizers/productAnalysisCanonicalizer";
import { validateProductAnalysis } from "../validators/validateProductAnalysis";

describe("Product Analysis Canonicalizer", () => {
  it("should canonicalize and validate correctly", () => {
    const raw = {
      product_name: "Áo thun",
      category: "Thời trang",
      attributes: { color: "Đen" },
      confidence: 0.9
    };

    const output = canonicalizeProductAnalysis(raw);

    expect(() => validateProductAnalysis(output)).not.toThrow();
    expect(output.name).toBe("Áo thun");
    expect(output.canonical_version).toBe("3.0");
  });

  it("should fill missing fields", () => {
    const raw = {};

    const output = canonicalizeProductAnalysis(raw);

    expect(output.name).toBe("Unknown Product");
    expect(output.category).toBe("UNCATEGORIZED");
  });
});
