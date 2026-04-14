import { validate } from "./validate";

export function validateProductAnalysis(output: any) {
  return validate("productAnalysis.schema.json", output);
}
