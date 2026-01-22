import React from 'react';
import { Plus, Copy, Trash, Film, Activity } from 'lucide-react';
import { Keyframe } from '../types';

// Auto-tween feature for frame interpolation

interface TimelineProps {
  keyframes: Keyframe[];
  currentFrameIndex: number;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: () => void;
  onDeleteFrame: () => void;
  isPlaying: boolean;
  onAutoInterpolate: (targetFrameIndex: number) => void;
  selectedObjectId: string | null;
}

const Timeline: React.FC<TimelineProps> = ({
  keyframes,
  currentFrameIndex,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  isPlaying,
  onAutoInterpolate,
  selectedObjectId
}) => {
  const [showTweenModal, setShowTweenModal] = React.useState(false);
  const [tweenFrames, setTweenFrames] = React.useState(10);

  const handleStartTween = () => {
    if (!selectedObjectId) return;
    setShowTweenModal(true);
  };

  const handleTweenComplete = () => {
    // First, ensure we have enough frames
    const targetFrameIndex = currentFrameIndex + tweenFrames;
    const framesToAdd = targetFrameIndex - (keyframes.length - 1);
    
    // Add frames if needed
    if (framesToAdd > 0) {
      for (let i = 0; i < framesToAdd; i++) {
        onAddFrame();
      }
    }
    
    // Wait a tick for frames to be added, then execute tween
    setTimeout(() => {
      onAutoInterpolate(targetFrameIndex);
      setShowTweenModal(false);
    }, 100);
  };

  const handleCancel = () => {
    setShowTweenModal(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" id="timeline-panel">
      {/* Tween Modal - Small, positioned at top, non-blocking */}
      {showTweenModal && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={handleCancel}></div>
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border-2 border-gray-900 p-4 shadow-2xl">
              <h3 className="text-base font-normal mb-3" style={{ fontFamily: 'Georgia, serif' }}>Auto Tween</h3>
              <div className="bg-blue-50 border border-blue-300 p-3 mb-3 text-xs text-gray-700">
                <p className="font-normal mb-2"><strong>Instructions:</strong></p>
                <p className="font-normal">1. Enter number of frames below</p>
                <p className="font-normal">2. Close this (click outside or Cancel)</p>
                <p className="font-normal">3. Move object to end position</p>
                <p className="font-normal">4. Click "Auto Tween" again</p>
                <p className="font-normal">5. Click "Create Tween"</p>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-600 font-normal block mb-1">Number of frames:</label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={tweenFrames}
                  onChange={(e) => setTweenFrames(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-full px-3 py-2 border-2 border-gray-300 text-center font-normal"
                  autoFocus
                />
              </div>
              <div className="bg-gray-100 border border-gray-300 p-2 mb-3 text-xs">
                <div className="flex justify-between font-normal text-gray-700">
                  <span>Start:</span>
                  <span>Frame {currentFrameIndex + 1}</span>
                </div>
                <div className="flex justify-between font-normal text-gray-700">
                  <span>End:</span>
                  <span>Frame {currentFrameIndex + tweenFrames + 1}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-3 py-2 border-2 border-gray-300 hover:bg-gray-100 text-gray-700 font-normal text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTweenComplete}
                  className="flex-1 px-3 py-2 border-2 border-gray-900 bg-gray-900 hover:bg-gray-700 text-white font-normal text-xs"
                >
                  Create Tween
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
        
        <div className="border-t-2 border-gray-300 pt-2 mt-1">
          <button 
            onClick={handleStartTween}
            disabled={isPlaying || !selectedObjectId}
            className="w-full px-3 py-2 transition-colors text-xs flex items-center justify-center gap-2 border-2 font-normal bg-white text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            title="Auto-interpolate between frames"
          >
            <Activity size={14} /> Auto Tween
          </button>
          {!selectedObjectId && !isPlaying && (
            <p className="text-[10px] text-gray-600 mt-2 text-center font-normal">
              Select an object first
            </p>
          )}
        </div>
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