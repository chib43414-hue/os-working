import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { AGENTS_METADATA, executeAgent } from './server/agents/index';
import { getGeminiClient } from './server/gemini';
import { evaluateSafety, getAuditLogs } from './server/safety/guardrails';
import { AgentId } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON body parsing with reasonable payload limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 1. Health check & Diagnostics API
  app.get('/api/health', (req, res) => {
    const hasAiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
    res.json({
      status: 'healthy',
      runtime: 'Node.js ' + process.version,
      timestamp: new Date().toISOString(),
      activeAgentsCount: AGENTS_METADATA.length,
      aiPowered: hasAiKey,
      sandbox: {
        piiMaskingEnabled: true,
        sqlFirewallEnabled: true,
        redosCircuitBreakerEnabled: true,
        protectedProcessShieldEnabled: true,
      },
    });
  });

  // 2. List all 10 Safe Agents with metadata, policies, and presets
  app.get('/api/agents/list', (req, res) => {
    res.json({
      success: true,
      agents: AGENTS_METADATA,
    });
  });

  // 3. Backend Source Code Exporter & Inspector endpoint
  app.get('/api/backend-files', (req, res) => {
    try {
      const filesToServe = [
        { path: 'server.ts', label: 'server.ts (Main Express Entry Point)', category: 'Core Server' },
        { path: 'server/gemini.ts', label: 'server/gemini.ts (Gemini GenAI SDK Handler)', category: 'Core Server' },
        { path: 'server/safety/guardrails.ts', label: 'server/safety/guardrails.ts (Safety Guardrails & PII Scrubbing)', category: 'Security' },
        { path: 'server/agents/index.ts', label: 'server/agents/index.ts (Agent Registry & Dispatcher)', category: 'Agent Engine' },
        { path: 'server/agents/systemMonitor.ts', label: 'server/agents/systemMonitor.ts (System Monitor Agent)', category: 'Agent Logic' },
        { path: 'server/agents/logAnalyzer.ts', label: 'server/agents/logAnalyzer.ts (Log Analyzer Agent)', category: 'Agent Logic' },
        { path: 'server/agents/processManager.ts', label: 'server/agents/processManager.ts (Process Manager Agent)', category: 'Agent Logic' },
        { path: 'server/agents/fileAnalyzer.ts', label: 'server/agents/fileAnalyzer.ts (File Analyzer Agent)', category: 'Agent Logic' },
        { path: 'server/agents/codeAssistant.ts', label: 'server/agents/codeAssistant.ts (Code Assistant Agent)', category: 'Agent Logic' },
        { path: 'server/agents/databaseQuery.ts', label: 'server/agents/databaseQuery.ts (Database Query Agent)', category: 'Agent Logic' },
        { path: 'server/agents/dataTransformer.ts', label: 'server/agents/dataTransformer.ts (Data Transformer Agent)', category: 'Agent Logic' },
        { path: 'server/agents/contentAnalyzer.ts', label: 'server/agents/contentAnalyzer.ts (Content Analyzer Agent)', category: 'Agent Logic' },
        { path: 'server/agents/regexTester.ts', label: 'server/agents/regexTester.ts (Regex Tester Agent)', category: 'Agent Logic' },
        { path: 'server/agents/systemOptimizer.ts', label: 'server/agents/systemOptimizer.ts (System Optimizer Agent)', category: 'Agent Logic' },
        { path: 'src/types.ts', label: 'src/types.ts (TypeScript Shared Types & Schemas)', category: 'Types' },
      ];

      const result = filesToServe.map((item) => {
        const fullPath = path.join(process.cwd(), item.path);
        let content = '';
        let lineCount = 0;
        let sizeBytes = 0;
        try {
          if (fs.existsSync(fullPath)) {
            content = fs.readFileSync(fullPath, 'utf-8');
            lineCount = content.split('\n').length;
            sizeBytes = Buffer.byteLength(content, 'utf-8');
          }
        } catch (e) {
          content = `// Error reading file: ${e}`;
        }
        return {
          path: item.path,
          label: item.label,
          category: item.category,
          lineCount,
          sizeBytes,
          content,
        };
      });

      res.json({
        success: true,
        totalFiles: result.length,
        files: result,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // 4. Pre-flight Safety Evaluation endpoint
  app.post('/api/agents/:agentId/safety-check', (req, res) => {
    const agentId = req.params.agentId as AgentId;
    const payload = req.body.payload || {};
    const dryRun = req.body.dryRun ?? true;

    const safety = evaluateSafety(agentId, payload, dryRun);
    res.json({
      success: true,
      agentId,
      safety,
    });
  });

  // 4. Universal Agent Execution endpoint
  app.post('/api/agents/:agentId/execute', async (req, res) => {
    try {
      const agentId = req.params.agentId as AgentId;
      const { payload = {}, dryRun = true, useAi = true } = req.body;

      const validAgent = AGENTS_METADATA.find((a) => a.id === agentId);
      if (!validAgent) {
        return res.status(404).json({
          success: false,
          error: `Agent "${agentId}" not found in safe agents registry.`,
        });
      }

      const result = await executeAgent(agentId, payload, { dryRun, useAi });
      return res.json(result);
    } catch (err: unknown) {
      console.error(`Error executing agent ${req.params.agentId}:`, err);
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Internal agent execution error',
      });
    }
  });

  // 5. Multi-Agent Pipeline Chain execution
  app.post('/api/pipeline/chain', async (req, res) => {
    try {
      const { steps = [] } = req.body;
      const pipelineResults: Array<{ stepIndex: number; agentId: AgentId; result: unknown }> = [];

      let currentPayload: Record<string, unknown> = {};

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const agentId = step.agentId as AgentId;
        const mergedPayload = { ...currentPayload, ...(step.payload || {}) };

        const stepResult = await executeAgent(agentId, mergedPayload, {
          dryRun: step.dryRun ?? true,
          useAi: step.useAi ?? true,
        });

        pipelineResults.push({
          stepIndex: i + 1,
          agentId,
          result: stepResult,
        });

        // Pass output forward to subsequent agent in chain
        if (stepResult.success && stepResult.data) {
          currentPayload = { previousStepData: stepResult.data };
        }
      }

      res.json({
        success: true,
        totalSteps: steps.length,
        pipelineResults,
      });
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Pipeline execution failed',
      });
    }
  });

  // 6. Audit Trail Logs API
  app.get('/api/safety/audit-logs', (req, res) => {
    const agentId = req.query.agentId as AgentId | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const logs = getAuditLogs(agentId, limit);
    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SafeAgents backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
