import { validate } from "./validate";

export function validatePricing(output: any) {
  return validate("pricing.schema.json", output);
}
