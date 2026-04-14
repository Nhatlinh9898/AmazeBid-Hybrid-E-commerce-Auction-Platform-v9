import { cloudAI } from "../providers/cloudAI";
import { localAI } from "../providers/localAI";

export async function productAnalysisTask(input: any) {
  const rawOutput = await cloudAI.run("PRODUCT_ANALYSIS", input);
  const finalOutput = await localAI.canonicalize("PRODUCT_ANALYSIS", rawOutput);

  return { rawOutput, finalOutput };
}
