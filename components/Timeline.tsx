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
  onAutoInterpolate: (numFrames: number, endState: { x: number; y: number; rotation: number }) => void;
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
  const [numFrames, setNumFrames] = React.useState(10);
  const [endX, setEndX] = React.useState(0);
  const [endY, setEndY] = React.useState(0);
  const [endRotation, setEndRotation] = React.useState(0);

  const handleStartTween = () => {
    if (!selectedObjectId) return;
    setShowTweenModal(true);
  };

  const handleCreateTween = () => {
    // Pass the end state values to the parent
    onAutoInterpolate(numFrames, { x: endX, y: endY, rotation: endRotation });
    setShowTweenModal(false);
  };

  const handleCancel = () => {
    setShowTweenModal(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" id="timeline-panel">
      {/* Tween Modal - Simple Motion Definition */}
      {showTweenModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleCancel}></div>
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-96" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border-2 border-gray-900 p-5 shadow-2xl">
              <h3 className="text-base font-normal mb-4" style={{ fontFamily: 'Georgia, serif' }}>Auto Tween Motion</h3>
              
              <div className="bg-gray-50 border border-gray-300 p-3 mb-4 text-xs">
                <p className="font-normal text-gray-700">
                  <strong>Start:</strong> Frame {currentFrameIndex + 1} (current position)
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-gray-600 font-normal block mb-1">Number of frames:</label>
                  <input
                    type="number"
                    min="2"
                    max="100"
                    value={numFrames}
                    onChange={(e) => setNumFrames(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-full px-3 py-2 border-2 border-gray-300 text-center font-normal"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">End frame will be: {currentFrameIndex + numFrames + 1}</p>
                </div>

                <div className="border-t border-gray-300 pt-3">
                  <label className="text-xs text-gray-600 font-normal block mb-2">End Position:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">X:</label>
                      <input
                        type="number"
                        value={endX}
                        onChange={(e) => setEndX(Number(e.target.value))}
                        className="w-full px-2 py-1 border-2 border-gray-300 text-xs font-normal"
                        placeholder="X position"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Y:</label>
                      <input
                        type="number"
                        value={endY}
                        onChange={(e) => setEndY(Number(e.target.value))}
                        className="w-full px-2 py-1 border-2 border-gray-300 text-xs font-normal"
                        placeholder="Y position"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-normal block mb-1">End Rotation (degrees):</label>
                  <input
                    type="number"
                    value={endRotation}
                    onChange={(e) => setEndRotation(Number(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-gray-300 text-center font-normal"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 hover:bg-gray-100 text-gray-700 font-normal text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTween}
                  className="flex-1 px-4 py-2 border-2 border-gray-900 bg-gray-900 hover:bg-gray-700 text-white font-normal text-xs"
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
            <p className="text-[10px] text-gray-600 mt-2 text-center font-normal leading-relaxed">
              <strong>How to use:</strong><br/>
              1. Select object<br/>
              2. Position at START<br/>
              3. Click Auto Tween<br/>
              4. Enter END position & frames<br/>
              5. Done!
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