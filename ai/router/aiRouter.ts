import { taskRegistry } from "./taskRegistry";
import { prisma } from "../../services/prisma";
import { validateInput } from "../validators/input/validateInput";

export class AIRouter {
  static async processTask(taskId: string) {
    const task = await prisma.aITask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");

    const handler = taskRegistry[task.type];
    if (!handler) throw new Error(`No handler for task type: ${task.type}`);

    try {
      // Validate Input
      switch (task.type) {
        case "PRODUCT_ANALYSIS":
          validateInput("productAnalysisInput.schema.json", task.input);
          break;
        case "PRICING_SUGGESTION":
          validateInput("pricingInput.schema.json", task.input);
          break;
        case "MARKETING_CONTENT":
          validateInput("marketingInput.schema.json", task.input);
          break;
        case "CONTENT_CANONICALIZATION":
          validateInput("contentInput.schema.json", task.input);
          break;
      }

      await prisma.aITask.update({
        where: { id: taskId },
        data: { status: "PROCESSING" }
      });

      const { rawOutput, finalOutput } = await handler(task.input);

      await prisma.aITask.update({
        where: { id: taskId },
        data: {
          outputRaw: rawOutput,
          outputFinal: finalOutput,
          status: "COMPLETED"
        }
      });

    } catch (err: any) {
      await prisma.aITask.update({
        where: { id: taskId },
        data: {
          status: "FAILED",
          errorMessage: err.message
        }
      });

      throw err;
    }
  }
}
