import { cloudAI } from "../providers/cloudAI";
import { localAI } from "../providers/localAI";
import { validatePricingSuggestionInput } from "../router/validators";

export async function pricingSuggestionTask(input: any) {
  validatePricingSuggestionInput(input);

  const rawOutput = await cloudAI.run("PRICING_SUGGESTION", input);
  const finalOutput = await localAI.canonicalize("PRICING_SUGGESTION", rawOutput);

  return { rawOutput, finalOutput };
}
