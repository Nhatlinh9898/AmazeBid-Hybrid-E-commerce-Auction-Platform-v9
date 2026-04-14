import { cloudAI } from "../providers/cloudAI";
import { localAI } from "../providers/localAI";
import { validateMarketingContentInput } from "../router/validators";

export async function marketingContentTask(input: any) {
  validateMarketingContentInput(input);

  const rawOutput = await cloudAI.run("MARKETING_CONTENT", input);
  const finalOutput = await localAI.canonicalize("MARKETING_CONTENT", rawOutput);

  return { rawOutput, finalOutput };
}
