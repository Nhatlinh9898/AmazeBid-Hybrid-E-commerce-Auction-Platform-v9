import { cloudAI } from "../providers/cloudAI";
import { localAI } from "../providers/localAI";
import { validateImageGenerationInput } from "../router/validators";

export async function imageGenerationTask(input: any) {
  validateImageGenerationInput(input);

  const rawOutput = await cloudAI.run("IMAGE_GENERATION", input);
  const finalOutput = await localAI.canonicalize("IMAGE_GENERATION", rawOutput);

  return { rawOutput, finalOutput };
}
