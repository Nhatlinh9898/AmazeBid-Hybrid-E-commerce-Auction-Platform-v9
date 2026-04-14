export interface ProductAnalysisRaw {
  product_name?: string;
  name?: string;
  category?: string;
  attributes?: {
    color?: string;
    size?: string;
    material?: string;
    [key: string]: any;
  };
  confidence?: number;
  [key: string]: any;
}

export interface ProductAnalysisCanonical {
  name: string;
  category: string;
  attributes: {
    color?: string;
    size?: string;
    material?: string;
    [key: string]: any;
  };
  confidence: number;
  canonical_version: string;
}

export function canonicalizeProductAnalysis(raw: ProductAnalysisRaw): ProductAnalysisCanonical {
  const name = raw.name || raw.product_name || "Unknown Product";
  const category = raw.category || "UNCATEGORIZED";
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.5;

  return {
    name,
    category,
    attributes: {
      color: raw.attributes?.color,
      size: raw.attributes?.size,
      material: raw.attributes?.material,
      ...raw.attributes
    },
    confidence,
    canonical_version: "3.0"
  };
}
