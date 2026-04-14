import { validate } from "./validate";

export function validateMarketing(output: any) {
  return validate("marketing.schema.json", output);
}
