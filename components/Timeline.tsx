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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 p-3 border-b-2 border-gray-400 bg-[#fafaf8]">
        <button 
          onClick={onAddFrame}
          disabled={isPlaying}
          className="w-full px-3 py-2 hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors text-xs flex items-center justify-center gap-2 border-2 border-gray-300 bg-white font-normal"
        >
          <Plus size={14} /> New Frame
        </button>
        <button 
          onClick={onDuplicateFrame}
          disabled={isPlaying}
          className="w-full px-3 py-2 hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors text-xs flex items-center justify-center gap-2 border-2 border-gray-300 bg-white font-normal"
        >
          <Copy size={14} /> Duplicate
        </button>
        <button 
          onClick={onDeleteFrame}
          disabled={isPlaying || keyframes.length <= 1}
          className="w-full px-3 py-2 hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition-colors text-xs flex items-center justify-center gap-2 border-2 border-gray-300 bg-white font-normal"
        >
          <Trash size={14} /> Delete
        </button>
      </div>

      {/* Frames List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {keyframes.map((frame, idx) => (
          <div
            key={frame.id}
            onClick={() => onSelectFrame(idx)}
            className={`
              w-full h-20 border-2 cursor-pointer transition-all duration-200 relative
              flex flex-col items-center justify-center text-sm font-normal
              ${idx === currentFrameIndex 
                ? 'border-gray-900 bg-gray-100 shadow-sm' 
                : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400'}
            `}
          >
            <span className="text-xs text-gray-500 font-normal">Frame</span>
            <span className="text-lg font-normal text-gray-900">{idx + 1}</span>
            {/* Active Indicator */}
            {idx === currentFrameIndex && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gray-900" />
            )}
          </div>
        ))}
        
        {/* Quick Add Button at End */}
        <button 
            onClick={onAddFrame}
            className="w-full h-16 border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors bg-white"
        >
            <Plus size={20} />
        </button>
      </div>
    </div>
  );
};

export default Timeline;