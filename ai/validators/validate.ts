import { ajv } from "./ajv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadSchema(schemaName: string) {
  let validator = ajv.getSchema(schemaName);
  if (!validator) {
    const filePath = path.join(__dirname, "..", "schemas", schemaName);
    const schema = JSON.parse(fs.readFileSync(filePath, "utf8"));
    ajv.addSchema(schema, schemaName);
    validator = ajv.getSchema(schemaName);
  }
  return validator;
}

export function validate(schemaName: string, data: any) {
  const validator = loadSchema(schemaName);
  if (!validator) throw new Error(`Schema ${schemaName} not found`);

  const valid = validator(data);

  if (!valid) {
    const errors = validator.errors?.map(e => `${e.instancePath} ${e.message}`).join(", ");
    throw new Error(`Schema validation failed: ${errors}`);
  }

  return true;
}
