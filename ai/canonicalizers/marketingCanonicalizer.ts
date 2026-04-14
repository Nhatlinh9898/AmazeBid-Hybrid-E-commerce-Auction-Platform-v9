export interface MarketingRaw {
  title?: string;
  headline?: string;
  description?: string;
  body?: string;
  [key: string]: any;
}

export interface MarketingCanonical {
  title: string;
  short_description: string;
  long_description: string;
  canonical_version: string;
}

export function canonicalizeMarketingContent(raw: MarketingRaw): MarketingCanonical {
  const title = raw.title || raw.headline || "Sản phẩm nổi bật từ AmazeBid";
  const long = raw.long_description || raw.description || raw.body || "";
  const short = raw.short_description || long.slice(0, 120);

  return {
    title,
    short_description: short,
    long_description: long,
    canonical_version: "3.0"
  };
}
