import { getAllAgents, createTask, updateTaskStatus, addAgentOutput, addMessage, getConversationHistory, updateMetrics } from "./agents";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";

/**
 * Jarvis Orchestrator Service
 * Central AI agent that coordinates all specialized agents
 */

interface JarvisContext {
  userId: string | null;
  conversationId: string;
}

interface AgentRoutingDecision {
  agentId: string;
  agentName: string;
  task: string;
  reasoning: string;
}

interface JarvisResponse {
  message: string;
  tasks: string[];
  reasoning: string;
}

/**
 * Initialize Jarvis with system prompt and agent registry
 */
async function getSystemPrompt(): Promise<string> {
  const allAgents = await getAllAgents();

  const agentDescriptions = allAgents
    .map(agent => `- ${agent.name} (${agent.category}): ${agent.description}`)
    .join('\n');

  return `You are Jarvis, an advanced AI operating system controller. You have access to the following specialized agents:

${agentDescriptions}

Your role is to:
1. Understand user commands in natural language
2. Decompose complex tasks into subtasks
3. Route tasks to the most appropriate agents
4. Aggregate and synthesize results
5. Provide clear, concise responses

When responding:
- Be direct and technical
- Explain your reasoning for agent selection
- Format responses as JSON with this structure:
{
  "message": "Your response to the user",
  "tasks": [
    {
      "agentId": "agent-id",
      "agentName": "Agent Name",
      "task": "Specific task description",
      "reasoning": "Why this agent is best for this task"
    }
  ],
  "reasoning": "Overall reasoning for your response"
}`;
}

/**
 * Process user command through Jarvis
 */
export async function processCommand(command: string, ctx: JarvisContext): Promise<JarvisResponse> {
  const startTime = Date.now();

  try {
    // Add user message to history
    await addMessage(ctx.userId, 'user', command, 'text');

    // Get conversation context
    const history = await getConversationHistory(10);
    const conversationContext = history
      .reverse()
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    // Get system prompt with agent registry
    const systemPrompt = await getSystemPrompt();

    // Call LLM to get Jarvis decision
    const llmResult = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Previous conversation:\n${conversationContext}\n\nNew command: ${command}` },
      ],
      maxTokens: 1000,
    });

    const llmResponse = llmResult.choices[0]?.message.content || '';

    // Parse LLM response
    let jarvisDecision: any;
    try {
      // Extract JSON from response (handle both string and array content)
      const responseText = typeof llmResponse === 'string' ? llmResponse : JSON.stringify(llmResponse);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      jarvisDecision = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Failed to parse Jarvis response:", error);
      jarvisDecision = {
        message: typeof llmResponse === 'string' ? llmResponse : JSON.stringify(llmResponse),
        tasks: [],
        reasoning: "Direct response without agent delegation",
      };
    }

    // Create tasks for each routed agent
    const taskIds: string[] = [];
    if (jarvisDecision.tasks && Array.isArray(jarvisDecision.tasks)) {
      for (const taskSpec of jarvisDecision.tasks) {
        try {
          const task = await createTask(taskSpec.agentId, taskSpec.task);
          taskIds.push(task.id);

          // Update task status to running
          await updateTaskStatus(task.id, 'running');

          // Simulate agent execution (in production, this would call actual agents)
          const agentResponse = await executeAgent(taskSpec.agentId, taskSpec.task);

          // Update task with output
          await updateTaskStatus(task.id, 'completed', agentResponse);

          // Add output to streaming
          await addAgentOutput(task.id, agentResponse, true);

          // Update metrics
          const executionTime = Date.now() - startTime;
          await updateMetrics(taskSpec.agentId, executionTime, true);
        } catch (error) {
          console.error(`Failed to execute task for agent ${taskSpec.agentId}:`, error);
        }
      }
    }

    // Add Jarvis response to message history
    await addMessage(ctx.userId, 'jarvis', jarvisDecision.message, 'text', {
      tasks: taskIds,
      reasoning: jarvisDecision.reasoning,
    });

    return {
      message: jarvisDecision.message,
      tasks: taskIds,
      reasoning: jarvisDecision.reasoning,
    };
  } catch (error) {
    console.error("Jarvis processing error:", error);
    throw error;
  }
}

/**
 * Execute agent task (simulated for now)
 */
async function executeAgent(agentId: string, task: string): Promise<string> {
  // In production, this would:
  // 1. Load agent configuration
  // 2. Call agent-specific LLM with agent system prompt
  // 3. Stream results back
  // For now, return simulated response

  const agentResponses: { [key: string]: string } = {
    'osint-agent': `OSINT Analysis for: "${task}"\n\nSearching public databases...\n- Found 5 relevant sources\n- Cross-referencing data\n- Analysis complete`,
    'network-scanner': `Network Scan Results:\n\nTarget: ${task}\n- Port 22: SSH (OpenSSH 7.4)\n- Port 80: HTTP (Apache 2.4)\n- Port 443: HTTPS (nginx)\n- 3 open ports detected`,
    'code-assistant': `Code Analysis:\n\n${task}\n\n✓ Syntax valid\n✓ No critical issues\n⚠ 2 warnings: unused variables\n→ Suggestions: Optimize loop performance`,
    'system-monitor': `System Status:\n\nCPU: 45%\nMemory: 62%\nDisk: 78%\nNetwork: 125 Mbps\n\nAll systems operational`,
  };

  return agentResponses[agentId] || `Agent ${agentId} processed: ${task}`;
}

/**
 * Process voice input (transcribed text)
 */
export async function processVoiceCommand(transcribedText: string, ctx: JarvisContext): Promise<JarvisResponse> {
  // Add voice message to history
  await addMessage(ctx.userId, 'user', transcribedText, 'voice');

  // Process as regular command
  return processCommand(transcribedText, ctx);
}

/**
 * Get Jarvis status and agent registry
 */
export async function getJarvisStatus() {
  const agents = await getAllAgents();

  return {
    status: 'online',
    agentsAvailable: agents.length,
    agents: agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      category: agent.category,
    })),
    timestamp: new Date(),
  };
}
