import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { agents, tasks, agentOutputs, messages, agentMetrics, Agent, Task, AgentOutput, Message, AgentMetric } from "../drizzle/schema";
import { nanoid } from "nanoid";

/**
 * Agent Management Functions
 */

export async function createAgent(agent: Omit<Agent, 'createdAt'>): Promise<Agent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newAgent = {
    ...agent,
    id: agent.id || nanoid(),
    createdAt: new Date(),
  };

  await db.insert(agents).values(newAgent);
  return newAgent as Agent;
}

export async function getAllAgents(): Promise<Agent[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(agents);
}

export async function getAgentById(id: string): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result[0];
}

export async function updateAgentStatus(id: string, status: 'idle' | 'busy' | 'error'): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(agents).set({ status }).where(eq(agents.id, id));
}

/**
 * Task Management Functions
 */

export async function createTask(agentId: string, input: string): Promise<Task> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const task: Task = {
    id: nanoid(),
    agentId,
    input,
    status: 'pending',
    output: null,
    streamId: nanoid(),
    createdAt: new Date(),
    completedAt: null,
  };

  await db.insert(tasks).values(task);
  return task;
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function updateTaskStatus(id: string, status: 'pending' | 'running' | 'completed' | 'failed', output?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = { status };
  if (output) updates.output = output;
  if (status === 'completed' || status === 'failed') updates.completedAt = new Date();

  await db.update(tasks).set(updates).where(eq(tasks.id, id));
}

export async function getTasksByAgent(agentId: string): Promise<Task[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(tasks).where(eq(tasks.agentId, agentId)).orderBy(desc(tasks.createdAt));
}

/**
 * Streaming Output Functions
 */

export async function addAgentOutput(taskId: string, content: string, isComplete: boolean = false): Promise<AgentOutput> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const output: AgentOutput = {
    id: nanoid(),
    taskId,
    content,
    timestamp: new Date(),
    isComplete,
  };

  await db.insert(agentOutputs).values(output);
  return output;
}

export async function getTaskOutput(taskId: string): Promise<AgentOutput[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(agentOutputs).where(eq(agentOutputs.taskId, taskId)).orderBy(agentOutputs.timestamp);
}

/**
 * Message History Functions
 */

export async function addMessage(userId: string | null, sender: 'user' | 'jarvis' | 'agent', content: string, type: 'text' | 'voice' | 'system' = 'text', metadata?: any): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const message: Message = {
    id: nanoid(),
    userId,
    sender,
    content,
    type,
    metadata,
    createdAt: new Date(),
  };

  await db.insert(messages).values(message);
  return message;
}

export async function getConversationHistory(limit: number = 50): Promise<Message[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(messages).orderBy(desc(messages.createdAt)).limit(limit);
}

/**
 * Metrics Functions
 */

export async function getOrCreateMetrics(agentId: string): Promise<AgentMetric> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(agentMetrics).where(eq(agentMetrics.agentId, agentId)).limit(1);

  if (result[0]) return result[0];

  const metrics: AgentMetric = {
    id: nanoid(),
    agentId,
    tasksCompleted: 0,
    tasksFailedCount: 0,
    averageExecutionTime: 0,
    lastExecutedAt: null,
  };

  await db.insert(agentMetrics).values(metrics);
  return metrics;
}

export async function updateMetrics(agentId: string, executionTime: number, success: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const metrics = await getOrCreateMetrics(agentId);

  const tasksCompleted = success ? (metrics.tasksCompleted ?? 0) + 1 : (metrics.tasksCompleted ?? 0);
  const tasksFailedCount = !success ? (metrics.tasksFailedCount ?? 0) + 1 : (metrics.tasksFailedCount ?? 0);
  const totalTasks = tasksCompleted + tasksFailedCount;
  const averageExecutionTime = ((metrics.averageExecutionTime || 0) * (totalTasks - 1) + executionTime) / totalTasks;

  await db.update(agentMetrics)
    .set({
      tasksCompleted,
      tasksFailedCount,
      averageExecutionTime,
      lastExecutedAt: new Date(),
    })
    .where(eq(agentMetrics.agentId, agentId));
}

export async function getAllMetrics(): Promise<AgentMetric[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(agentMetrics);
}
