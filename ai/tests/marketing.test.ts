import { describe, it, expect } from "vitest";
import { canonicalizeMarketingContent } from "../canonicalizers/marketingCanonicalizer";
import { validateMarketing } from "../validators/validateMarketing";

describe("Marketing Canonicalizer", () => {
  it("should canonicalize marketing content", () => {
    const raw = {
      title: "Áo thun cotton",
      description: "Chất liệu cotton thoáng mát..."
    };

    const output = canonicalizeMarketingContent(raw);

    expect(() => validateMarketing(output)).not.toThrow();
    expect(output.title).toBe("Áo thun cotton");
  });
});
