import { validate } from "./validate";

export function validateContent(output: any) {
  return validate("content.schema.json", output);
}
