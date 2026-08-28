export interface Agent {
  id: string;
  name: string;
  category: string;
  status: 'idle' | 'busy' | 'error';
  description: string;
  capabilities: string[];
  tasksCompleted: number;
}

export const AGENT_LIBRARY: Agent[] = [
  // Security & Intelligence Agents
  {
    id: 'osint-agent',
    name: 'OSINT Agent',
    category: 'Security',
    status: 'idle',
    description: 'Open-source intelligence gathering and data collection',
    capabilities: ['web-scraping', 'data-mining', 'public-records', 'social-media-analysis'],
    tasksCompleted: 156,
  },
  {
    id: 'network-scanner',
    name: 'Network Scanner',
    category: 'Security',
    status: 'idle',
    description: 'Port scanning and network service enumeration',
    capabilities: ['port-scanning', 'service-detection', 'vulnerability-scanning', 'network-mapping'],
    tasksCompleted: 89,
  },
  {
    id: 'threat-intel',
    name: 'Threat Intelligence',
    category: 'Security',
    status: 'idle',
    description: 'Threat analysis and security intelligence',
    capabilities: ['threat-analysis', 'malware-detection', 'ioc-tracking', 'attack-patterns'],
    tasksCompleted: 234,
  },
  {
    id: 'password-auditor',
    name: 'Password Auditor',
    category: 'Security',
    status: 'idle',
    description: 'Password strength analysis and credential auditing',
    capabilities: ['password-strength', 'breach-detection', 'credential-analysis', 'policy-enforcement'],
    tasksCompleted: 567,
  },
  {
    id: 'ssl-analyzer',
    name: 'SSL/TLS Analyzer',
    category: 'Security',
    status: 'idle',
    description: 'SSL certificate and encryption analysis',
    capabilities: ['certificate-validation', 'encryption-analysis', 'cipher-strength', 'expiry-tracking'],
    tasksCompleted: 423,
  },

  // Development & Code Analysis
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    category: 'Development',
    status: 'idle',
    description: 'Code analysis, debugging, and optimization',
    capabilities: ['code-review', 'bug-detection', 'optimization', 'refactoring'],
    tasksCompleted: 1203,
  },
  {
    id: 'dependency-checker',
    name: 'Dependency Checker',
    category: 'Development',
    status: 'idle',
    description: 'Analyze project dependencies and vulnerabilities',
    capabilities: ['dependency-analysis', 'vulnerability-scanning', 'version-tracking', 'conflict-detection'],
    tasksCompleted: 678,
  },
  {
    id: 'api-analyzer',
    name: 'API Analyzer',
    category: 'Development',
    status: 'idle',
    description: 'REST API testing and analysis',
    capabilities: ['api-testing', 'endpoint-discovery', 'response-analysis', 'security-testing'],
    tasksCompleted: 445,
  },
  {
    id: 'container-inspector',
    name: 'Container Inspector',
    category: 'Development',
    status: 'idle',
    description: 'Docker and container security analysis',
    capabilities: ['image-scanning', 'layer-analysis', 'vulnerability-detection', 'config-audit'],
    tasksCompleted: 334,
  },

  // System & Infrastructure
  {
    id: 'system-monitor',
    name: 'System Monitor',
    category: 'Infrastructure',
    status: 'busy',
    description: 'Real-time system metrics and performance monitoring',
    capabilities: ['cpu-monitoring', 'memory-tracking', 'disk-analysis', 'process-monitoring'],
    tasksCompleted: 5678,
  },
  {
    id: 'log-analyzer',
    name: 'Log Analyzer',
    category: 'Infrastructure',
    status: 'idle',
    description: 'Parse and analyze system and application logs',
    capabilities: ['log-parsing', 'pattern-detection', 'anomaly-detection', 'correlation'],
    tasksCompleted: 2341,
  },
  {
    id: 'firewall-monitor',
    name: 'Firewall Monitor',
    category: 'Infrastructure',
    status: 'idle',
    description: 'Firewall rule analysis and network traffic monitoring',
    capabilities: ['rule-analysis', 'traffic-monitoring', 'anomaly-detection', 'threat-blocking'],
    tasksCompleted: 1567,
  },
  {
    id: 'backup-manager',
    name: 'Backup Manager',
    category: 'Infrastructure',
    status: 'idle',
    description: 'Backup integrity and recovery management',
    capabilities: ['backup-verification', 'recovery-testing', 'retention-analysis', 'disaster-recovery'],
    tasksCompleted: 892,
  },

  // Data & Analytics
  {
    id: 'web-scraper',
    name: 'Web Scraper',
    category: 'Data',
    status: 'idle',
    description: 'Extract and parse data from websites',
    capabilities: ['web-scraping', 'data-extraction', 'content-parsing', 'dynamic-rendering'],
    tasksCompleted: 1456,
  },
  {
    id: 'data-processor',
    name: 'Data Processor',
    category: 'Data',
    status: 'idle',
    description: 'Data transformation and processing pipeline',
    capabilities: ['data-cleaning', 'transformation', 'aggregation', 'format-conversion'],
    tasksCompleted: 3421,
  },
  {
    id: 'analytics-engine',
    name: 'Analytics Engine',
    category: 'Data',
    status: 'idle',
    description: 'Statistical analysis and reporting',
    capabilities: ['statistical-analysis', 'trend-detection', 'forecasting', 'reporting'],
    tasksCompleted: 2156,
  },
  {
    id: 'database-auditor',
    name: 'Database Auditor',
    category: 'Data',
    status: 'idle',
    description: 'Database security and performance auditing',
    capabilities: ['query-analysis', 'index-optimization', 'security-audit', 'performance-tuning'],
    tasksCompleted: 1834,
  },

  // Automation & Orchestration
  {
    id: 'task-scheduler',
    name: 'Task Scheduler',
    category: 'Automation',
    status: 'idle',
    description: 'Automated task scheduling and execution',
    capabilities: ['job-scheduling', 'workflow-automation', 'trigger-management', 'execution-tracking'],
    tasksCompleted: 4567,
  },
  {
    id: 'workflow-engine',
    name: 'Workflow Engine',
    category: 'Automation',
    status: 'idle',
    description: 'Complex workflow orchestration and management',
    capabilities: ['workflow-design', 'process-automation', 'error-handling', 'state-management'],
    tasksCompleted: 2890,
  },
  {
    id: 'notification-hub',
    name: 'Notification Hub',
    category: 'Automation',
    status: 'idle',
    description: 'Alert and notification management',
    capabilities: ['alert-routing', 'notification-delivery', 'escalation', 'deduplication'],
    tasksCompleted: 6234,
  },
  {
    id: 'compliance-checker',
    name: 'Compliance Checker',
    category: 'Automation',
    status: 'idle',
    description: 'Regulatory compliance and policy enforcement',
    capabilities: ['policy-validation', 'compliance-reporting', 'audit-logging', 'remediation'],
    tasksCompleted: 1123,
  },

  // Advanced Intelligence
  {
    id: 'ml-classifier',
    name: 'ML Classifier',
    category: 'Intelligence',
    status: 'idle',
    description: 'Machine learning classification and prediction',
    capabilities: ['classification', 'prediction', 'anomaly-detection', 'pattern-recognition'],
    tasksCompleted: 3456,
  },
  {
    id: 'nlp-processor',
    name: 'NLP Processor',
    category: 'Intelligence',
    status: 'idle',
    description: 'Natural language processing and text analysis',
    capabilities: ['text-analysis', 'sentiment-analysis', 'entity-extraction', 'language-detection'],
    tasksCompleted: 2678,
  },
];

export const getAgentsByCategory = (category: string): Agent[] => {
  return AGENT_LIBRARY.filter(agent => agent.category === category);
};

export const getAgentById = (id: string): Agent | undefined => {
  return AGENT_LIBRARY.find(agent => agent.id === id);
};

export const getActiveAgents = (): Agent[] => {
  return AGENT_LIBRARY.filter(agent => agent.status !== 'error');
};

export const getAgentStats = () => {
  return {
    total: AGENT_LIBRARY.length,
    active: AGENT_LIBRARY.filter(a => a.status === 'busy').length,
    idle: AGENT_LIBRARY.filter(a => a.status === 'idle').length,
    error: AGENT_LIBRARY.filter(a => a.status === 'error').length,
    totalTasksCompleted: AGENT_LIBRARY.reduce((sum, a) => sum + a.tasksCompleted, 0),
  };
};
