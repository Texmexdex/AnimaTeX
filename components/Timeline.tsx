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
    <div id="timeline-panel" className="w-full h-32 bg-[#2a2a2a] border-t border-gray-700 flex flex-col">
      {/* Toolbar */}
      <div className="h-10 flex items-center px-4 space-x-2 border-b border-gray-700 bg-gray-800">
        <span className="text-xs font-medium text-gray-400 tracking-widest mr-4 flex items-center gap-2">
            <Film size={14} /> TIMELINE
        </span>
        <button 
          onClick={onAddFrame}
          disabled={isPlaying}
          className="p-1.5 hover:bg-gray-700 text-gray-300 hover:text-white disabled:opacity-50 transition-colors text-xs flex items-center gap-1 border border-gray-600"
        >
          <Plus size={14} /> New
        </button>
        <button 
          onClick={onDuplicateFrame}
          disabled={isPlaying}
          className="p-1.5 hover:bg-gray-700 text-gray-300 hover:text-white disabled:opacity-50 transition-colors text-xs flex items-center gap-1 border border-gray-600"
        >
          <Copy size={14} /> Duplicate
        </button>
        <button 
          onClick={onDeleteFrame}
          disabled={isPlaying || keyframes.length <= 1}
          className="p-1.5 hover:bg-red-900/20 text-red-400 hover:text-red-200 disabled:opacity-50 transition-colors text-xs flex items-center gap-1 border border-gray-600"
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
              flex-shrink-0 w-20 h-16 border cursor-pointer transition-all duration-200 relative group
              flex items-center justify-center text-sm font-mono
              ${idx === currentFrameIndex 
                ? 'border-gray-400 bg-gray-700' 
                : 'border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-gray-500'}
            `}
          >
            <span className="opacity-50 text-gray-400">F{idx + 1}</span>
            {/* Active Indicator */}
            {idx === currentFrameIndex && (
                <div className="absolute -bottom-1 w-1 h-1 bg-gray-400 rounded-full" />
            )}
          </div>
        ))}
        
        {/* Quick Add Button at End */}
        <button 
            onClick={onAddFrame}
            className="flex-shrink-0 w-8 h-16 border border-dashed border-gray-600 hover:border-gray-500 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors"
        >
            <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default Timeline;