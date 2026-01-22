import React from 'react';
import { Plus, Copy, Trash, Film } from 'lucide-react';
import { Keyframe } from '../types';

interface TimelineProps {
  keyframes: Keyframe[];
  currentFrameIndex: number;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: () => void;
  onDeleteFrame: () => void;
  isPlaying: boolean;
}

const Timeline: React.FC<TimelineProps> = ({
  keyframes,
  currentFrameIndex,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  isPlaying
}) => {
  return (
    <div id="timeline-panel" className="w-full h-32 bg-black/40 backdrop-blur-md border-t border-white/10 flex flex-col">
      {/* Toolbar */}
      <div className="h-10 flex items-center px-4 space-x-2 border-b border-white/5 bg-white/5">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-4 flex items-center gap-2">
            <Film size={14} /> Timeline
        </span>
        <button 
          onClick={onAddFrame}
          disabled={isPlaying}
          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-50 transition-colors text-xs flex items-center gap-1"
        >
          <Plus size={14} /> New
        </button>
        <button 
          onClick={onDuplicateFrame}
          disabled={isPlaying}
          className="p-1.5 rounded hover:bg-white/10 text-gray-300 hover:text-white disabled:opacity-50 transition-colors text-xs flex items-center gap-1"
        >
          <Copy size={14} /> Duplicate
        </button>
        <button 
          onClick={onDeleteFrame}
          disabled={isPlaying || keyframes.length <= 1}
          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-200 disabled:opacity-50 transition-colors text-xs flex items-center gap-1"
        >
          <Trash size={14} /> Delete
        </button>
      </div>

      {/* Frames Strip */}
      <div className="flex-1 overflow-x-auto p-4 flex space-x-2 scrollbar-hide">
        {keyframes.map((frame, idx) => (
          <div
            key={frame.id}
            onClick={() => onSelectFrame(idx)}
            className={`
              flex-shrink-0 w-20 h-16 rounded-md border cursor-pointer transition-all duration-200 relative group
              flex items-center justify-center text-sm font-mono
              ${idx === currentFrameIndex 
                ? 'border-blue-500 bg-blue-500/20 scale-105 shadow-lg shadow-blue-500/20' 
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'}
            `}
          >
            <span className="opacity-50">F{idx + 1}</span>
            {/* Active Indicator */}
            {idx === currentFrameIndex && (
                <div className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_5px_rgba(59,130,246,1)]" />
            )}
          </div>
        ))}
        
        {/* Quick Add Button at End */}
        <button 
            onClick={onAddFrame}
            className="flex-shrink-0 w-8 h-16 rounded-md border border-dashed border-white/10 hover:border-white/30 flex items-center justify-center text-white/20 hover:text-white/50 transition-colors"
        >
            <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default Timeline;