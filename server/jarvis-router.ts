import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { processCommand, processVoiceCommand, getJarvisStatus } from "./jarvis";
import { getAllAgents, getAgentById, getTaskById, getTaskOutput } from "./agents";

export const jarvisRouter = router({
  /**
   * Jarvis Command Processing
   */
  command: protectedProcedure
    .input(z.object({
      text: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      return processCommand(input.text, {
        userId: ctx.user.id.toString(),
        conversationId: `conv-${ctx.user.id}`,
      });
    }),

  voiceCommand: protectedProcedure
    .input(z.object({
      transcribedText: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      return processVoiceCommand(input.transcribedText, {
        userId: ctx.user.id.toString(),
        conversationId: `conv-${ctx.user.id}`,
      });
    }),

  status: publicProcedure
    .query(async () => {
      return getJarvisStatus();
    }),

  /**
   * Agent Management
   */
  agents: publicProcedure
    .query(async () => {
      const agents = await getAllAgents();
      return agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        category: agent.category,
        capabilities: agent.capabilities,
        status: agent.status,
      }));
    }),

  agentDetails: publicProcedure
    .input(z.object({
      agentId: z.string(),
    }))
    .query(async ({ input }) => {
      const agent = await getAgentById(input.agentId);
      if (!agent) throw new Error("Agent not found");
      return agent;
    }),

  /**
   * Task Management
   */
  taskStatus: publicProcedure
    .input(z.object({
      taskId: z.string(),
    }))
    .query(async ({ input }) => {
      const task = await getTaskById(input.taskId);
      if (!task) throw new Error("Task not found");
      return task;
    }),

  taskOutput: publicProcedure
    .input(z.object({
      taskId: z.string(),
    }))
    .query(async ({ input }) => {
      const outputs = await getTaskOutput(input.taskId);
      return outputs.map(output => ({
        id: output.id,
        content: output.content,
        timestamp: output.timestamp,
        isComplete: output.isComplete,
      }));
    }),
});

export type JarvisRouter = typeof jarvisRouter;
