export interface PricingRaw {
  recommended_price?: number;
  price?: number;
  strategy?: string;
  reason?: string;
  [key: string]: any;
}

export interface PricingCanonical {
  price: number;
  strategy: "AGGRESSIVE" | "BALANCED" | "CONSERVATIVE";
  explanation: string;
  canonical_version: string;
}

export function canonicalizePricingSuggestion(raw: PricingRaw): PricingCanonical {
  const price = raw.price ?? raw.recommended_price ?? 0;

  let strategy: PricingCanonical["strategy"] = "BALANCED";
  const s = (raw.strategy || "").toLowerCase();
  if (s.includes("aggressive")) strategy = "AGGRESSIVE";
  else if (s.includes("conservative")) strategy = "CONSERVATIVE";

  const explanation = raw.reason || "No explanation provided";

  return {
    price,
    strategy,
    explanation,
    canonical_version: "3.0"
  };
}
