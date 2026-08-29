import React, { useState, useRef, useEffect } from 'react';
import TerminalPanel from './TerminalPanel';

interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
}

const COMMAND_RESPONSES: { [key: string]: string } = {
  'help': 'Available commands: scan, analyze, monitor, status, clear, exit',
  'scan': 'Initiating network scan...\n[*] Scanning 192.168.1.0/24\n[+] Found 8 active hosts\n[+] Port 22: SSH\n[+] Port 80: HTTP\n[+] Port 443: HTTPS',
  'analyze': 'Running analysis...\n[*] Processing data\n[+] 1,234 events analyzed\n[+] 5 anomalies detected\n[!] Risk level: MEDIUM',
  'monitor': 'System monitoring active...\nCPU: 45% | RAM: 62% | DISK: 78% | NET: 125 Mbps',
  'status': 'JARVIS STATUS:\n[✓] Core: ONLINE\n[✓] Agents: 6 ACTIVE\n[✓] Database: CONNECTED\n[✓] LLM: READY',
  'clear': '',
  'exit': 'Terminating session...',
};

export const TerminalEmulator: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '0',
      text: 'JARVIS Terminal Emulator v1.0',
      type: 'system',
    },
    {
      id: '1',
      text: 'Type "help" for available commands',
      type: 'system',
    },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    terminalRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [lines]);

  const executeCommand = (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add input line
    const inputLine: TerminalLine = {
      id: Date.now().toString(),
      text: `$ ${command}`,
      type: 'input',
    };

    setLines(prev => [...prev, inputLine]);

    // Get response
    const cmd = command.toLowerCase().trim();
    let response = COMMAND_RESPONSES[cmd] || `Command not found: ${cmd}. Type "help" for available commands.`;

    if (cmd === 'clear') {
      setLines([
        {
          id: Date.now().toString(),
          text: 'Terminal cleared',
          type: 'system',
        },
      ]);
    } else {
      // Add output lines
      const outputLines = response.split('\n');
      outputLines.forEach((line, index) => {
        setTimeout(() => {
          setLines(prev => [
            ...prev,
            {
              id: `${Date.now()}-${index}`,
              text: line,
              type: 'output',
            },
          ]);
        }, index * 50);
      });
    }

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <TerminalPanel
      id="TERMINAL"
      title="System Terminal"
      headerColor="green"
      className="w-full"
    >
      <div className="flex flex-col h-full">
        {/* Output */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto space-y-0 text-xs font-mono"
        >
          {lines.map(line => (
            <div
              key={line.id}
              className={
                line.type === 'input'
                  ? 'text-neon-green'
                  : line.type === 'error'
                  ? 'text-red-500'
                  : line.type === 'system'
                  ? 'text-neon-cyan'
                  : 'text-neon-green opacity-75'
              }
            >
              {line.text}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-neon-green pt-2 mt-2">
          <div className="flex items-center gap-1">
            <span className="text-neon-green">$</span>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 bg-transparent text-neon-green outline-none font-mono text-xs"
              placeholder="Enter command..."
            />
            <span className="text-neon-green animate-pulse">▮</span>
          </div>
        </div>
      </div>
    </TerminalPanel>
  );
};

export default TerminalEmulator;
