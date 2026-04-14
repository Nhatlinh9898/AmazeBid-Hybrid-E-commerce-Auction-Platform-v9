import { cloudAI } from "../providers/cloudAI";
import { localAI } from "../providers/localAI";
import { validateCanonicalizationInput } from "../router/validators";

export async function canonicalizationTask(input: any) {
  validateCanonicalizationInput(input);

  const rawOutput = await cloudAI.run("CONTENT_CANONICALIZATION", input);
  const finalOutput = await localAI.canonicalize("CONTENT_CANONICALIZATION", rawOutput);

  return { rawOutput, finalOutput };
}
