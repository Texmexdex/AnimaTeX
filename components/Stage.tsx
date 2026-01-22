import React, { useRef, useEffect } from 'react';
import { AnimObject, ObjectState } from '../types';
import { RotateCw, Maximize, Trash2 } from 'lucide-react';

interface StageProps {
  width: number;
  height: number;
  objects: AnimObject[];
  currentFrameState: Record<string, ObjectState>;
  onUpdateObject: (id: string, update: Partial<ObjectState>) => void;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  isPlaying: boolean;
  onDeleteObject: (id: string) => void;
  isExporting: boolean;
}

const Stage: React.FC<StageProps> = ({
  width,
  height,
  objects,
  currentFrameState,
  onUpdateObject,
  selectedObjectId,
  onSelectObject,
  isPlaying,
  onDeleteObject,
  isExporting
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use refs for drag state to handle rapid mouse movements without re-renders
  const dragInfo = useRef({
      isDragging: false,
      startX: 0,
      startY: 0,
      initialState: null as ObjectState | null,
      activeTool: 'move' as 'move' | 'rotate' | 'scale',
      centerX: 0,
      centerY: 0
  });

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!selectedObjectId || isPlaying || isExporting) return;
        // Ignore if typing in an input field
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        const currentObj = currentFrameState[selectedObjectId];
        if (!currentObj) return;

        const step = e.shiftKey ? 10 : 1;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                onUpdateObject(selectedObjectId, { y: currentObj.y - step });
                break;
            case 'ArrowDown':
                e.preventDefault();
                onUpdateObject(selectedObjectId, { y: currentObj.y + step });
                break;
            case 'ArrowLeft':
                e.preventDefault();
                onUpdateObject(selectedObjectId, { x: currentObj.x - step });
                break;
            case 'ArrowRight':
                e.preventDefault();
                onUpdateObject(selectedObjectId, { x: currentObj.x + step });
                break;
            case 'ArrowRight':
                e.preventDefault();
                onUpdateObject(selectedObjectId, { x: currentObj.x + step });
                break;
            case 'Delete':
            case 'Backspace':
                // Optional: Map Delete key to remove from frame
                onDeleteObject(selectedObjectId);
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, currentFrameState, onUpdateObject, isPlaying, isExporting, onDeleteObject]);

  // Global Mouse Listeners for robust dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!dragInfo.current.isDragging || !selectedObjectId) return;
        
        const { startX, startY, initialState, activeTool, centerX, centerY } = dragInfo.current;
        if (!initialState) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (activeTool === 'move') {
            onUpdateObject(selectedObjectId, {
                x: initialState.x + dx,
                y: initialState.y + dy
            });
        } else if (activeTool === 'scale') {
             const scaleFactor = 1 + dx / 200;
             onUpdateObject(selectedObjectId, {
                width: Math.max(10, initialState.width * scaleFactor),
                height: Math.max(10, initialState.height * scaleFactor)
             });
        } else if (activeTool === 'rotate') {
             // Calculate angle relative to object center
             const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
             const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
             
             let deltaAngle = currentAngle - startAngle;
             let newRotation = (initialState.rotation + deltaAngle) % 360;
             if (newRotation < 0) newRotation += 360;

             onUpdateObject(selectedObjectId, {
                rotation: newRotation
             });
        }
    };

    const handleMouseUp = () => {
        dragInfo.current.isDragging = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedObjectId, onUpdateObject]);

  // Handle outside click to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // If we are currently dragging, ignore click-outside logic
      if (dragInfo.current.isDragging) return;

      const target = e.target as Node;
      const propertyPanel = document.getElementById('property-panel');
      const timelinePanel = document.getElementById('timeline-panel');
      const stage = document.getElementById('anim-stage');
      
      // Don't deselect if clicking on timeline or property panel
      if (
          stage && !stage.contains(target) &&
          !propertyPanel?.contains(target) &&
          !timelinePanel?.contains(target)
      ) {
        onSelectObject(null);
      }
    };

    if (!isPlaying && !isExporting) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onSelectObject, isPlaying, isExporting]);

  const handleObjectMouseDown = (e: React.MouseEvent, id: string) => {
    if (isPlaying || isExporting) return;
    e.stopPropagation();
    e.preventDefault(); // Prevent native drag

    // Handle overlapping selection cycling
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const overlappingIds = elements
        .map(el => el.getAttribute('data-anim-id'))
        .filter((attr): attr is string => attr !== null && attr !== undefined);

    let targetId = id;

    if (overlappingIds.length > 0) {
        if (selectedObjectId && overlappingIds.includes(selectedObjectId)) {
            const currentIndex = overlappingIds.indexOf(selectedObjectId);
            const nextIndex = (currentIndex + 1) % overlappingIds.length;
            targetId = overlappingIds[nextIndex];
        } else {
            targetId = overlappingIds[0];
        }
    }
    
    onSelectObject(targetId);
    
    const objState = currentFrameState[targetId];

    dragInfo.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        initialState: { ...objState },
        activeTool: 'move',
        centerX: 0,
        centerY: 0
    };
  };

  const handleToolMouseDown = (e: React.MouseEvent, id: string, tool: 'rotate' | 'scale') => {
      if (isPlaying || isExporting) return;
      e.stopPropagation();
      e.preventDefault();
      
      const objState = currentFrameState[id];
      // Calculate object center in client coordinates for rotation
      const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
      const centerX = rect ? rect.left + rect.width / 2 : 0;
      const centerY = rect ? rect.top + rect.height / 2 : 0;

      dragInfo.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          initialState: { ...objState },
          activeTool: tool,
          centerX,
          centerY
      };
  };

  return (
    <div 
      className={`
        relative
        ${isExporting ? '' : 'bg-white border border-gray-300'}
      `}
      style={{ width, height }}
      ref={containerRef}
      id="anim-stage"
    >
      {/* Grid Background */}
      {!isExporting && (
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
                backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                backgroundSize: '20px 20px' 
            }}
          />
      )}

      {objects.map((obj) => {
        const state = currentFrameState[obj.id];
        if (!state) return null;

        const isSelected = selectedObjectId === obj.id;

        return (
          <div
            key={obj.id}
            data-anim-id={obj.id}
            className={`absolute select-none group ${isSelected && !isPlaying && !isExporting ? 'z-[100]' : ''}`}
            style={{
              transform: `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg) scaleX(${state.flipX ? -1 : 1})`,
              width: state.width,
              height: state.height,
              zIndex: isSelected && !isExporting ? 100 : state.zIndex,
              opacity: state.opacity,
              cursor: (isPlaying || isExporting) ? 'default' : 'move'
            }}
            onMouseDown={(e) => handleObjectMouseDown(e, obj.id)}
          >
            <img 
              src={obj.src} 
              alt="anim-obj" 
              className="w-full h-full object-contain pointer-events-none"
              crossOrigin="anonymous" 
            />
            
            {/* Selection Controls */}
            {isSelected && !isPlaying && !isExporting && (
              <div className="absolute inset-0 border border-gray-900">
                 <div 
                    className="absolute -bottom-3 -right-3 w-6 h-6 bg-gray-900 flex items-center justify-center cursor-se-resize hover:bg-gray-700 transition-colors pointer-events-auto"
                    style={{ transform: `scaleX(${state.flipX ? -1 : 1})` }}
                    onMouseDown={(e) => handleToolMouseDown(e, obj.id, 'scale')}
                    title="Scale"
                 >
                    <Maximize size={12} color="white" />
                 </div>
                 <div 
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors pointer-events-auto"
                    style={{ transform: `scaleX(${state.flipX ? -1 : 1})` }}
                    onMouseDown={(e) => handleToolMouseDown(e, obj.id, 'rotate')}
                    title="Rotate"
                 >
                    <RotateCw size={12} color="white" />
                 </div>
                 <div 
                    className="absolute -top-3 -right-3 w-6 h-6 bg-gray-900 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors pointer-events-auto"
                    style={{ transform: `scaleX(${state.flipX ? -1 : 1})` }}
                    onClick={(e) => { e.stopPropagation(); onDeleteObject(obj.id); }}
                    title="Remove from Frame"
                 >
                    <Trash2 size={12} color="white" />
                 </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Stage;