import { cloudAI } from "../providers/cloudAI";
import { localAI } from "../providers/localAI";
import { validateVideoGenerationInput } from "../router/validators";

export async function videoGenerationTask(input: any) {
  validateVideoGenerationInput(input);

  const rawOutput = await cloudAI.run("VIDEO_GENERATION", input);
  const finalOutput = await localAI.canonicalize("VIDEO_GENERATION", rawOutput);

  return { rawOutput, finalOutput };
}
