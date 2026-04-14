import { describe, it, expect } from "vitest";
import { canonicalizeContent } from "../canonicalizers/contentCanonicalizer";
import { validateContent } from "../validators/validateContent";

describe("Content Canonicalizer", () => {
  it("should clean and validate content", () => {
    const raw = { raw_content: "  Hello   world !  " };

    const output = canonicalizeContent(raw);

    expect(() => validateContent(output)).not.toThrow();
    expect(output.clean_content).toBe("Hello world!");
  });
});
