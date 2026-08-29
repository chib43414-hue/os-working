import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import TerminalText from './TerminalText';

interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  content: string;
  timestamp: Date;
}

export const JarvisChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'jarvis',
      content: 'JARVIS ONLINE. Ready to execute commands.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate Jarvis response
    setTimeout(() => {
      const responses = [
        'Command received. Executing task delegation...',
        'Routing to appropriate agents. Stand by.',
        'Processing request through neural network.',
        'Task completed. Results compiled.',
        'All systems nominal. Ready for next command.',
      ];

      const jarvisMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'jarvis',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, jarvisMessage]);
    }, 500);
  };

  const handleMicClick = () => {
    setIsListening(!isListening);
    if (isListening) {
      setTranscription('');
    } else {
      // Simulate voice input
      const voiceInputs = [
        'Scan network for vulnerabilities',
        'Analyze system logs',
        'Execute security audit',
        'Monitor active processes',
      ];
      setTranscription(voiceInputs[Math.floor(Math.random() * voiceInputs.length)]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black border border-neon-green">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-3 py-2 font-mono text-sm ${
                msg.sender === 'user'
                  ? 'bg-neon-magenta/20 border border-neon-magenta text-neon-magenta'
                  : 'bg-neon-green/10 border border-neon-green text-neon-green'
              }`}
            >
              <div className="text-xs opacity-70 mb-1">
                [{msg.sender.toUpperCase()}] {msg.timestamp.toLocaleTimeString()}
              </div>
              <div>{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Transcription Display */}
      {transcription && (
        <div className="px-3 py-2 bg-neon-magenta/10 border-t border-neon-magenta text-neon-magenta text-xs font-mono">
          <span className="text-neon-cyan">[VOICE INPUT]</span> {transcription}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-neon-green p-3 bg-black space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Enter command..."
            className="flex-1 bg-black border border-neon-green text-neon-green px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
          />
          <button
            onClick={handleSendMessage}
            className="btn-terminal"
            title="Send command"
          >
            <Send size={16} />
          </button>
          <button
            onClick={handleMicClick}
            className={`btn-terminal ${isListening ? 'bg-neon-magenta/20' : ''}`}
            title="Voice input"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>
        <div className="text-xs text-neon-cyan opacity-70">
          {isListening ? '🔴 RECORDING...' : '⚪ Ready'}
        </div>
      </div>
    </div>
  );
};

export default JarvisChat;
