export interface ContentRaw {
  raw_content?: string;
  text?: string;
  [key: string]: any;
}

export interface ContentCanonical {
  clean_content: string;
  style: "AmazeBid";
  canonical_version: string;
}

export function canonicalizeContent(raw: ContentRaw): ContentCanonical {
  const base = raw.raw_content || raw.text || "";

  const clean = base
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();

  return {
    clean_content: clean,
    style: "AmazeBid",
    canonical_version: "3.0"
  };
}
