import React, { useState } from 'react';
import TerminalPanel from './TerminalPanel';
import { Code2, Music, Globe, Shield, Terminal, FileText } from 'lucide-react';

interface App {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: 'green' | 'cyan' | 'magenta';
}

const APPS: App[] = [
  {
    id: 'vscode',
    name: 'VS Code',
    icon: <Code2 size={24} />,
    description: 'Code Editor',
    color: 'cyan',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: <Music size={24} />,
    description: 'Music Player',
    color: 'green',
  },
  {
    id: 'chrome',
    name: 'Chrome',
    icon: <Globe size={24} />,
    description: 'Web Browser',
    color: 'magenta',
  },
  {
    id: 'tor',
    name: 'Tor Browser',
    icon: <Shield size={24} />,
    description: 'Anonymous Browsing',
    color: 'green',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: <Terminal size={24} />,
    description: 'System Terminal',
    color: 'cyan',
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: <FileText size={24} />,
    description: 'Text Editor',
    color: 'magenta',
  },
];

export const AppLauncher: React.FC = () => {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const colorMap = {
    green: '#00ff64',
    cyan: '#00ffc8',
    magenta: '#ff00ff',
  };

  return (
    <TerminalPanel id="APPS" title="Application Launcher" headerColor="cyan">
      <div className="space-y-2">
        <div style={{ color: '#00ffc8' }} className="text-xs font-bold mb-4">
          ╔════════════════════════════════╗
          <br />
          ║  AVAILABLE APPLICATIONS (6)    ║
          <br />
          ╚════════════════════════════════╝
        </div>

        <div className="grid grid-cols-3 gap-2">
          {APPS.map(app => (
            <button
              key={app.id}
              onClick={() => setSelectedApp(app.id)}
              className="p-3 border transition-all hover:scale-105"
              style={{
                borderColor: colorMap[app.color],
                backgroundColor: selectedApp === app.id ? `${colorMap[app.color]}20` : '#000',
                color: colorMap[app.color],
              }}
            >
              <div className="flex flex-col items-center gap-2">
                {app.icon}
                <div className="text-xs font-bold">{app.name}</div>
                <div className="text-xs opacity-70">{app.description}</div>
              </div>
            </button>
          ))}
        </div>

        {selectedApp && (
          <div
            className="mt-4 p-3 border"
            style={{
              borderColor: colorMap[APPS.find(a => a.id === selectedApp)?.color || 'green'],
              backgroundColor: '#000',
              color: colorMap[APPS.find(a => a.id === selectedApp)?.color || 'green'],
            }}
          >
            <div className="text-xs font-bold mb-2">
              [{selectedApp.toUpperCase()}] LAUNCHING...
            </div>
            <div className="text-xs opacity-75">
              Initializing {APPS.find(a => a.id === selectedApp)?.name}...
              <br />
              Loading resources... 100%
              <br />
              <span className="text-green-500">✓ Application ready</span>
            </div>
          </div>
        )}
      </div>
    </TerminalPanel>
  );
};

export default AppLauncher;
