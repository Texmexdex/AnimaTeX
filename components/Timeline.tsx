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
    <div id="timeline-panel" className="w-full h-32 bg-white border-t-2 border-gray-400 flex flex-col">
      {/* Toolbar */}
      <div className="h-10 flex items-center px-6 space-x-3 border-b border-gray-300 bg-[#fafaf8]">
        <span className="text-xs font-normal text-gray-600 tracking-wide mr-4 flex items-center gap-2">
            <Film size={14} /> Timeline
        </span>
        <button 
          onClick={onAddFrame}
          disabled={isPlaying}
          className="px-3 py-1 hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors text-xs flex items-center gap-1 border border-gray-300 bg-white"
        >
          <Plus size={14} /> New
        </button>
        <button 
          onClick={onDuplicateFrame}
          disabled={isPlaying}
          className="px-3 py-1 hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors text-xs flex items-center gap-1 border border-gray-300 bg-white"
        >
          <Copy size={14} /> Duplicate
        </button>
        <button 
          onClick={onDeleteFrame}
          disabled={isPlaying || keyframes.length <= 1}
          className="px-3 py-1 hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors text-xs flex items-center gap-1 border border-gray-300 bg-white"
        >
          <Trash size={14} /> Delete
        </button>
      </div>

      {/* Frames Strip */}
      <div className="flex-1 overflow-x-auto p-4 flex space-x-2 scrollbar-hide bg-[#fafaf8]">
        {keyframes.map((frame, idx) => (
          <div
            key={frame.id}
            onClick={() => onSelectFrame(idx)}
            className={`
              flex-shrink-0 w-20 h-16 border-2 cursor-pointer transition-all duration-200 relative group
              flex items-center justify-center text-sm font-normal
              ${idx === currentFrameIndex 
                ? 'border-gray-900 bg-white shadow-sm' 
                : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400'}
            `}
          >
            <span className="opacity-60 text-gray-700">F{idx + 1}</span>
            {/* Active Indicator */}
            {idx === currentFrameIndex && (
                <div className="absolute -bottom-1 w-2 h-2 bg-gray-900" />
            )}
          </div>
        ))}
        
        {/* Quick Add Button at End */}
        <button 
            onClick={onAddFrame}
            className="flex-shrink-0 w-8 h-16 border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors bg-white"
        >
            <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default Timeline;