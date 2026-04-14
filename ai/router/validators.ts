export function validateProductAnalysisInput(input: any) {
  if (!input || typeof input !== 'object') throw new Error("Invalid input format");
  if (!input.title) throw new Error("Missing title");
  if (!input.description) throw new Error("Missing description");
}

export function validatePricingSuggestionInput(input: any) {
  if (!input || typeof input !== 'object') throw new Error("Invalid input format");
  if (typeof input.cost_price !== 'number') throw new Error("Missing or invalid cost_price");
  if (!Array.isArray(input.market_prices)) throw new Error("Missing or invalid market_prices");
}

export function validateMarketingContentInput(input: any) {
  if (!input || typeof input !== 'object') throw new Error("Invalid input format");
  if (!input.product_name) throw new Error("Missing product_name");
}

export function validateCanonicalizationInput(input: any) {
  if (!input || typeof input !== 'object') throw new Error("Invalid input format");
  if (!input.raw_content) throw new Error("Missing raw_content");
}

export function validateImageGenerationInput(input: any) {
  if (!input || typeof input !== 'object') throw new Error("Invalid input format");
  if (!input.prompt) throw new Error("Missing prompt");
}

export function validateVideoGenerationInput(input: any) {
  if (!input || typeof input !== 'object') throw new Error("Invalid input format");
  if (!input.prompt) throw new Error("Missing prompt");
}
