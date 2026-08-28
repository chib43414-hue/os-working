import React, { useState } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';

interface TerminalPanelProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  className?: string;
  headerColor?: 'green' | 'cyan' | 'magenta';
}

const headerColorMap = {
  green: 'border-neon-green text-neon-green',
  cyan: 'border-neon-cyan text-neon-cyan',
  magenta: 'border-neon-magenta text-neon-magenta',
};

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  id,
  title,
  children,
  onClose,
  onMinimize,
  isMinimized = false,
  className = '',
  headerColor = 'green',
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const headerClass = headerColorMap[headerColor];

  return (
    <div
      className={`
        terminal-panel flex flex-col h-full
        ${isMaximized ? 'fixed inset-0 z-50' : ''}
        ${className}
      `}
      data-panel-id={id}
    >
      {/* Header */}
      <div className={`border-b ${headerClass} px-3 py-2 flex items-center justify-between bg-black`}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-bold">[{id}]</span>
          <span className="text-sm font-mono">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1 hover:opacity-75 transition-opacity"
              title="Minimize"
            >
              <Minimize2 size={14} />
            </button>
          )}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:opacity-75 transition-opacity"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Maximize2 size={14} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:opacity-75 transition-opacity"
              title="Close"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto p-3 bg-black">
          {children}
        </div>
      )}
    </div>
  );
};

export default TerminalPanel;
