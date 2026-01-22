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
  const [tweenStartFrame, setTweenStartFrame] = React.useState(0);

  const handleStartTween = () => {
    if (!selectedObjectId) return;
    // Capture the START frame
    setTweenStartFrame(currentFrameIndex);
    setShowTweenModal(true);
  };

  const handleSelectEndFrame = (targetIndex: number) => {
    if (targetIndex <= tweenStartFrame) {
      alert('Please select a frame after the start frame');
      return;
    }
    // Execute the tween between start and target
    onAutoInterpolate(targetIndex);
    setShowTweenModal(false);
  };

  const handleCancel = () => {
    setShowTweenModal(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" id="timeline-panel">
      {/* Tween Modal - Frame Selection Mode */}
      {showTweenModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCancel}></div>
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border-2 border-gray-900 p-5 shadow-2xl">
              <h3 className="text-base font-normal mb-3" style={{ fontFamily: 'Georgia, serif' }}>Auto Tween Setup</h3>
              
              <div className="bg-blue-50 border-2 border-blue-400 p-4 mb-4 text-xs space-y-2">
                <p className="font-normal text-gray-800">
                  <strong>Start Frame: {tweenStartFrame + 1}</strong> (current position saved)
                </p>
                <p className="font-normal text-gray-700">
                  Now click on a frame below to set as the END frame. All frames in between will be automatically filled.
                </p>
              </div>
              
              <div className="max-h-64 overflow-y-auto border-2 border-gray-300 p-2 mb-4 bg-gray-50">
                <div className="space-y-1">
                  {keyframes.map((frame, idx) => (
                    <button
                      key={frame.id}
                      onClick={() => handleSelectEndFrame(idx)}
                      disabled={idx <= tweenStartFrame}
                      className={`
                        w-full px-3 py-2 text-xs font-normal transition-colors text-left border-2
                        ${idx === tweenStartFrame 
                          ? 'bg-blue-100 border-blue-400 text-blue-900 cursor-not-allowed' 
                          : idx < tweenStartFrame
                          ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300 hover:bg-gray-100 hover:border-gray-900 text-gray-700'}
                      `}
                    >
                      {idx === tweenStartFrame && '▶ '}
                      Frame {idx + 1}
                      {idx === tweenStartFrame && ' (START)'}
                      {idx > tweenStartFrame && ` (+${idx - tweenStartFrame} frames)`}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleCancel}
                className="w-full px-4 py-2 border-2 border-gray-300 hover:bg-gray-100 text-gray-700 font-normal text-xs"
              >
                Cancel
              </button>
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
            <p className="text-[10px] text-gray-600 mt-2 text-center font-normal leading-relaxed">
              <strong>How to use:</strong><br/>
              1. Select an object<br/>
              2. Position at START<br/>
              3. Create/go to END frame<br/>
              4. Position at END<br/>
              5. Click Auto Tween<br/>
              6. Select END frame
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