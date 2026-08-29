import React, { useState } from 'react';
import WindowManager from '@/components/WindowManager';
import TerminalPanel from '@/components/TerminalPanel';
import JarvisChat from '@/components/JarvisChat';
import SystemHUD from '@/components/SystemHUD';
import AgentPanel from '@/components/AgentPanel';
import TerminalEmulator from '@/components/TerminalEmulator';

export default function JarvisOS() {
  const [layout, setLayout] = useState<'grid' | 'focus'>('grid');

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-4 grid-rows-3 gap-1 w-full h-full p-1 bg-black">
        {/* Top Left: System HUD */}
        <div className="col-span-1 row-span-1 overflow-hidden">
          <TerminalPanel id="HUD" title="System Status" headerColor="cyan">
            <SystemHUD />
          </TerminalPanel>
        </div>

        {/* Top Center-Right: Agent Panel */}
        <div className="col-span-3 row-span-1 overflow-hidden">
          <TerminalPanel id="AGENTS" title="Agent Registry" headerColor="cyan">
            <AgentPanel />
          </TerminalPanel>
        </div>

        {/* Middle Left: Jarvis Chat */}
        <div className="col-span-2 row-span-2 overflow-hidden">
          <TerminalPanel id="JARVIS" title="Jarvis Master Agent" headerColor="magenta">
            <JarvisChat />
          </TerminalPanel>
        </div>

        {/* Middle Right: Terminal Emulator */}
        <div className="col-span-2 row-span-2 overflow-hidden">
          <TerminalPanel id="TERMINAL" title="System Terminal" headerColor="green">
            <TerminalEmulator />
          </TerminalPanel>
        </div>

        {/* Bottom: Status Bar */}
        <div className="col-span-4 row-span-1 overflow-hidden">
          <TerminalPanel id="STATUS" title="System Status Bar" headerColor="green">
            <div className="text-xs font-mono text-neon-green space-y-1">
              <div className="flex justify-between">
                <span>[JARVIS v1.0]</span>
                <span>Agents: 6/24 | Tasks: 0 | Uptime: 00:00:00</span>
                <span className="text-neon-cyan">[ONLINE]</span>
              </div>
              <div className="text-neon-cyan opacity-70">
                ▓▓▓▓▓▓▓▓▓▓ 100% • All systems operational
              </div>
            </div>
          </TerminalPanel>
        </div>
      </div>

      {/* Floating Scanlines Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 100, 0.1) 2px, rgba(0, 255, 100, 0.1) 4px)',
        }} />
      </div>
    </div>
  );
}
