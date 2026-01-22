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
  const [tweenStep, setTweenStep] = React.useState<'setup' | 'position'>('setup');

  const handleStartTween = () => {
    if (!selectedObjectId) return;
    setShowTweenModal(true);
    setTweenStep('setup');
  };

  const handleSetupComplete = () => {
    // Add the frames needed
    const framesToAdd = tweenFrames - (keyframes.length - currentFrameIndex - 1);
    for (let i = 0; i < framesToAdd; i++) {
      onAddFrame();
    }
    setTweenStep('position');
  };

  const handleTweenComplete = () => {
    const targetFrame = currentFrameIndex + tweenFrames;
    onAutoInterpolate(targetFrame);
    setShowTweenModal(false);
    setTweenStep('setup');
  };

  const handleCancel = () => {
    setShowTweenModal(false);
    setTweenStep('setup');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" id="timeline-panel">
      {/* Tween Modal */}
      {showTweenModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
          <div className="bg-white border-2 border-gray-900 p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {tweenStep === 'setup' ? (
              <>
                <h3 className="text-lg font-normal mb-4" style={{ fontFamily: 'Georgia, serif' }}>Auto Tween Setup</h3>
                <p className="text-sm text-gray-700 mb-4 font-normal">
                  How many frames should the animation take?
                </p>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={tweenFrames}
                  onChange={(e) => setTweenFrames(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-full px-3 py-2 border-2 border-gray-300 text-lg text-center font-normal mb-4"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 hover:bg-gray-100 text-gray-700 font-normal text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetupComplete}
                    className="flex-1 px-4 py-2 border-2 border-gray-900 bg-gray-900 hover:bg-gray-700 text-white font-normal text-sm"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-normal mb-4" style={{ fontFamily: 'Georgia, serif' }}>Position Your Object</h3>
                <p className="text-sm text-gray-700 mb-4 font-normal">
                  Move your object to the final position on the canvas, then click "Create Tween" to automatically fill all {tweenFrames} frames.
                </p>
                <div className="bg-gray-100 border-2 border-gray-300 p-3 mb-4">
                  <p className="text-xs text-gray-600 font-normal">
                    <strong>Current Frame:</strong> {currentFrameIndex + 1}<br/>
                    <strong>Target Frame:</strong> {currentFrameIndex + tweenFrames + 1}<br/>
                    <strong>Frames to Fill:</strong> {tweenFrames}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 hover:bg-gray-100 text-gray-700 font-normal text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTweenComplete}
                    className="flex-1 px-4 py-2 border-2 border-gray-900 bg-gray-900 hover:bg-gray-700 text-white font-normal text-sm"
                  >
                    Create Tween
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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