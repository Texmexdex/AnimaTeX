import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Image as ImageIcon, RotateCcw } from 'lucide-react';
import Stage from './components/Stage';
import Timeline from './components/Timeline';
import PropertyPanel from './components/PropertyPanel';
import AnimatedLogo from './components/AnimatedLogo';
import { AnimObject, Keyframe, ProjectState, ObjectState } from './types';
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, DEFAULT_FPS, INITIAL_OBJECT_STATE } from './constants';

// --- Math Helpers ---

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

const lerpAngle = (start: number, end: number, t: number) => {
    const diff = (end - start) % 360;
    const shortDiff = (2 * diff % 360) - diff;
    return start + shortDiff * t;
};

const getRotatedBounds = (x: number, y: number, w: number, h: number, rot: number) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const rad = (rot * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const corners = [
        { x: -w/2, y: -h/2 },
        { x: w/2, y: -h/2 },
        { x: w/2, y: h/2 },
        { x: -w/2, y: h/2 }
    ];
    
    const rotated = corners.map(p => ({
        x: cx + (p.x * cos - p.y * sin),
        y: cy + (p.x * sin + p.y * cos)
    }));
    
    const xs = rotated.map(p => p.x);
    const ys = rotated.map(p => p.y);
    
    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys)
    };
};

// Pure function to get state at a specific time 't'
const getInterpolatedState = (
    time: number, 
    keyframes: Keyframe[], 
    smoothMotion: boolean
): Record<string, ObjectState> => {
    // Determine frames
    const totalDuration = Math.max(1, keyframes.length - 1);
    
    // Allow reaching the exact end frame without clamping into the previous interval
    const clampedTime = Math.min(time, totalDuration);

    const frameIndexA = Math.floor(clampedTime);
    // If we are exactly at the end, A is the last frame. B doesn't exist.
    const frameIndexB = frameIndexA + 1;
    
    const t = clampedTime - frameIndexA;

    const frameA = keyframes[frameIndexA];
    const frameB = keyframes[frameIndexB];

    // Fallback if we are at the very end or only have 1 frame
    if (!frameB || !smoothMotion) {
        return frameA ? frameA.objects : {};
    }

    const allObjectIds = new Set([
        ...Object.keys(frameA.objects), 
        ...Object.keys(frameB.objects)
    ]);

    const state: Record<string, ObjectState> = {};

    allObjectIds.forEach(id => {
        const objA = frameA.objects[id];
        const objB = frameB.objects[id];

        if (objA && objB) {
            state[id] = {
                x: lerp(objA.x, objB.x, t),
                y: lerp(objA.y, objB.y, t),
                width: lerp(objA.width, objB.width, t),
                height: lerp(objA.height, objB.height, t),
                rotation: lerpAngle(objA.rotation, objB.rotation, t),
                opacity: lerp(objA.opacity, objB.opacity, t),
                zIndex: objA.zIndex,
                flipX: t < 0.5 ? objA.flipX : objB.flipX
            };
        } else if (objA) {
            state[id] = objA;
        } else if (objB) {
            state[id] = objB;
        }
    });

    return state;
};


const App: React.FC = () => {
  // --- State ---
  const [project, setProject] = useState<ProjectState>({
    fps: DEFAULT_FPS,
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    smoothMotion: true,
    objects: [],
    keyframes: [
      { id: 'frame-1', index: 0, objects: {} }
    ]
  });

  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Playback state
  const [playbackTime, setPlaybackTime] = useState(0); 

  // For playback loop
  const playbackRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // --- Computed State for Render ---
  // FIXED: Directly use keyframe data when editing to ensure WYSIWYG and avoid interpolation bugs
  const currentObjects = isPlaying 
    ? getInterpolatedState(playbackTime, project.keyframes, project.smoothMotion)
    : (project.keyframes[currentFrameIndex]?.objects || {});
  
  const selectedObjectState = selectedObjectId && currentObjects[selectedObjectId] ? currentObjects[selectedObjectId] : null;


  // --- Actions ---

  const handleAddObject = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const img = new Image();
        img.src = src;
        img.onload = () => {
             const newObj: AnimObject = {
                id: `obj-${Date.now()}`,
                src,
                name: file.name,
                type: 'image',
                naturalWidth: img.width,
                naturalHeight: img.height
              };

              setProject(prev => {
                const newKeyframes = prev.keyframes.map(kf => ({
                  ...kf,
                  objects: {
                    ...kf.objects,
                    [newObj.id]: { 
                        ...INITIAL_OBJECT_STATE, 
                        width: Math.min(200, img.width), 
                        height: Math.min(200, img.height * (200 / img.width)) 
                    }
                  }
                }));
                return {
                  ...prev,
                  objects: [...prev.objects, newObj],
                  keyframes: newKeyframes
                };
              });
              setSelectedObjectId(newObj.id);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateObject = useCallback((id: string, update: Partial<ObjectState>) => {
    setProject(prev => {
      // Ensure we target the currently selected frame
      const targetIndex = currentFrameIndex; 
      
      const newKeyframes = prev.keyframes.map((kf, i) => {
          if (i !== targetIndex) return kf;
          
          const objState = kf.objects[id];
          if (!objState) return kf;

          return {
              ...kf,
              objects: {
                  ...kf.objects,
                  [id]: { ...objState, ...update }
              }
          };
      });

      return { ...prev, keyframes: newKeyframes };
    });
  }, [currentFrameIndex]);

  const handleAddFrame = () => {
    setProject(prev => {
      const prevFrame = prev.keyframes[prev.keyframes.length - 1];
      const newFrame: Keyframe = {
        id: `frame-${Date.now()}`,
        index: prev.keyframes.length,
        objects: JSON.parse(JSON.stringify(prevFrame.objects)) 
      };
      return { ...prev, keyframes: [...prev.keyframes, newFrame] };
    });
    setCurrentFrameIndex(prev => prev + 1);
  };
  
  const handleDuplicateFrame = () => {
      setProject(prev => {
          const current = prev.keyframes[currentFrameIndex];
          const newFrame: Keyframe = {
              id: `frame-${Date.now()}`,
              index: currentFrameIndex + 1,
              objects: JSON.parse(JSON.stringify(current.objects))
          };
          const newKeyframes = [...prev.keyframes];
          newKeyframes.splice(currentFrameIndex + 1, 0, newFrame);
          newKeyframes.forEach((kf, i) => kf.index = i);
          return { ...prev, keyframes: newKeyframes };
      });
      setCurrentFrameIndex(prev => prev + 1);
  };

  const handleDeleteFrame = () => {
      if (project.keyframes.length <= 1) return;
      setProject(prev => {
          const newKeyframes = prev.keyframes.filter((_, i) => i !== currentFrameIndex);
          newKeyframes.forEach((kf, i) => kf.index = i);
          return { ...prev, keyframes: newKeyframes };
      });
      setCurrentFrameIndex(prev => Math.max(0, prev - 1));
  };

  const handleRemoveFromFrame = (id: string) => {
      setProject(prev => {
          const newKeyframes = prev.keyframes.map((kf, i) => {
              if (i !== currentFrameIndex) return kf;
              const newObjects = { ...kf.objects };
              delete newObjects[id];
              return { ...kf, objects: newObjects };
          });
          return { ...prev, keyframes: newKeyframes };
      });
      if (selectedObjectId === id) setSelectedObjectId(null);
  };

  const handleDeleteLayer = (id: string) => {
      setProject(prev => {
          const newObjects = prev.objects.filter(o => o.id !== id);
          const newKeyframes = prev.keyframes.map(kf => {
              const newObjects = { ...kf.objects };
              delete newObjects[id];
              return { ...kf, objects: newObjects };
          });
          return { ...prev, objects: newObjects, keyframes: newKeyframes };
      });
      if (selectedObjectId === id) setSelectedObjectId(null);
  };

  // Auto-interpolate frames between current and target
  const handleAutoInterpolate = (targetFrameIndex: number) => {
      if (!selectedObjectId || targetFrameIndex <= currentFrameIndex) return;
      
      // Make sure target frame exists
      if (targetFrameIndex >= project.keyframes.length) {
          console.error('Target frame does not exist');
          return;
      }
      
      const startFrame = project.keyframes[currentFrameIndex];
      const endFrame = project.keyframes[targetFrameIndex];
      
      if (!startFrame || !endFrame) {
          console.error('Start or end frame missing');
          return;
      }
      
      const startState = startFrame.objects[selectedObjectId];
      const endState = endFrame.objects[selectedObjectId];
      
      if (!startState || !endState) {
          console.error('Object not found in start or end frame');
          return;
      }
      
      const framesToInterpolate = targetFrameIndex - currentFrameIndex - 1;
      
      if (framesToInterpolate < 1) return;
      
      setProject(prev => {
          const newKeyframes = [...prev.keyframes];
          
          for (let i = 1; i <= framesToInterpolate; i++) {
              const t = i / (framesToInterpolate + 1);
              const frameIndex = currentFrameIndex + i;
              
              newKeyframes[frameIndex] = {
                  ...newKeyframes[frameIndex],
                  objects: {
                      ...newKeyframes[frameIndex].objects,
                      [selectedObjectId]: {
                          x: lerp(startState.x, endState.x, t),
                          y: lerp(startState.y, endState.y, t),
                          width: lerp(startState.width, endState.width, t),
                          height: lerp(startState.height, endState.height, t),
                          rotation: lerpAngle(startState.rotation, endState.rotation, t),
                          opacity: lerp(startState.opacity, endState.opacity, t),
                          zIndex: startState.zIndex,
                          flipX: t < 0.5 ? startState.flipX : endState.flipX
                      }
                  }
              };
          }
          
          return { ...prev, keyframes: newKeyframes };
      });
  };

  // --- Playback Logic ---

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
      // Reset to integer frame
      setCurrentFrameIndex(Math.floor(playbackTime) % project.keyframes.length);
    } else {
      setIsPlaying(true);
      lastTimeRef.current = performance.now();
      setPlaybackTime(currentFrameIndex);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;

    const animate = (time: number) => {
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const framesToAdd = (delta / 1000) * project.fps;
      const totalDuration = Math.max(1, project.keyframes.length - 1);

      setPlaybackTime(prev => {
          let next = prev + framesToAdd;
          if (next >= totalDuration) {
              next = next % totalDuration;
          }
          return next;
      });
      
      playbackRef.current = requestAnimationFrame(animate);
    };

    playbackRef.current = requestAnimationFrame(animate);

    return () => {
      if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
    };
  }, [isPlaying, project.fps, project.keyframes.length]);
  
  useEffect(() => {
      if(isPlaying) {
          // While playing, update index for timeline highlight
          setCurrentFrameIndex(Math.floor(playbackTime));
      }
  }, [playbackTime, isPlaying]);


  // --- Export Features ---

  const handleExportGif = async () => {
    if (project.keyframes.length < 2) {
        alert("Need at least 2 frames to animate.");
        return;
    }
    
    setIsExporting(true);
    if (isPlaying) togglePlay();

    let workerBlobURL = '';
    try {
        const workerResponse = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
        const workerScript = await workerResponse.text();
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        workerBlobURL = URL.createObjectURL(blob);
    } catch (e) {
        console.error("Failed to load GIF worker", e);
        setIsExporting(false);
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const GIF = (window as any).GIF;
    if (!GIF) {
        alert("GIF library not loaded");
        setIsExporting(false);
        return;
    }

    // 1. Calculate Bounding Box
    let minX = project.width;
    let minY = project.height;
    let maxX = 0;
    let maxY = 0;
    let hasObjects = false;

    project.keyframes.forEach(kf => {
        Object.values(kf.objects).forEach((obj: ObjectState) => {
            hasObjects = true;
            const bounds = getRotatedBounds(obj.x, obj.y, obj.width, obj.height, obj.rotation);
            minX = Math.min(minX, bounds.minX);
            minY = Math.min(minY, bounds.minY);
            maxX = Math.max(maxX, bounds.maxX);
            maxY = Math.max(maxY, bounds.maxY);
        });
    });

    if (!hasObjects) {
        minX = 0; minY = 0; maxX = project.width; maxY = project.height;
    }

    const padding = 20;
    minX = Math.max(0, Math.floor(minX - padding));
    minY = Math.max(0, Math.floor(minY - padding));
    maxX = Math.min(project.width, Math.ceil(maxX + padding));
    maxY = Math.min(project.height, Math.ceil(maxY + padding));

    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;

    if (cropWidth <= 0 || cropHeight <= 0) {
         alert("Invalid export bounds. Check your object positions.");
         setIsExporting(false);
         return;
    }

    // 2. Preload Images
    const imageCache: Record<string, HTMLImageElement> = {};
    const loadPromises = project.objects.map(obj => new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            imageCache[obj.id] = img;
            resolve();
        };
        img.onerror = () => resolve(); // Don't crash on error
        img.src = obj.src;
    }));

    await Promise.all(loadPromises);

    // 3. Setup GIF
    const gif = new GIF({
        workers: 4,
        quality: 10,
        width: cropWidth,
        height: cropHeight,
        workerScript: workerBlobURL,
        background: '#000000',
        transparent: null
    });

    const stepsPerKeyframe = project.smoothMotion ? 10 : 1; 
    const totalDuration = project.keyframes.length - 1;
    const totalExportSteps = totalDuration * stepsPerKeyframe;

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        setIsExporting(false);
        return;
    }

    // 4. Render Loop
    for (let i = 0; i <= totalExportSteps; i++) {
        const t = (i / totalExportSteps) * totalDuration;
        
        const frameState = getInterpolatedState(t, project.keyframes, project.smoothMotion);
        
        // Clear with white background instead of transparent
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, cropWidth, cropHeight);
        
        const sortedObjects = project.objects
            .filter(obj => frameState[obj.id]) 
            .sort((a, b) => (frameState[a.id].zIndex - frameState[b.id].zIndex));

        sortedObjects.forEach(obj => {
            const state = frameState[obj.id];
            const img = imageCache[obj.id];
            if (!img || !img.complete) return;

            ctx.save();
            
            const cx = state.x - minX + state.width / 2;
            const cy = state.y - minY + state.height / 2;
            
            ctx.translate(cx, cy);
            ctx.rotate(state.rotation * Math.PI / 180);
            ctx.scale(state.flipX ? -1 : 1, 1);
            ctx.globalAlpha = state.opacity;
            
            ctx.drawImage(img, -state.width / 2, -state.height / 2, state.width, state.height);
            
            ctx.restore();
        });

        const intervalDuration = 1000 / project.fps;
        const delay = Math.max(20, intervalDuration / stepsPerKeyframe); // Minimum 20ms delay
        gif.addFrame(ctx, { delay: Math.round(delay), copy: true });
    }

    gif.on('finished', (blob: Blob) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'animatex-export.gif';
        a.click();
        setIsExporting(false);
        URL.revokeObjectURL(workerBlobURL);
    });

    gif.render();
  };
  

  return (
    <div className="flex h-screen w-screen text-gray-900 overflow-hidden bg-[#f5f5f0]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {/* Left Sidebar - Timeline */}
        <div className="w-64 bg-white border-r-2 border-gray-400 flex flex-col">
            <div className="h-16 flex items-center px-4 border-b-2 border-gray-400 bg-[#fafaf8]">
                <h2 className="text-sm font-normal text-gray-900 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                    Timeline
                </h2>
            </div>
            
            <Timeline 
                keyframes={project.keyframes}
                currentFrameIndex={currentFrameIndex}
                onSelectFrame={(idx) => {
                    setCurrentFrameIndex(idx);
                    setPlaybackTime(idx);
                }}
                onAddFrame={handleAddFrame}
                onDuplicateFrame={handleDuplicateFrame}
                onDeleteFrame={handleDeleteFrame}
                isPlaying={isPlaying}
                onAutoInterpolate={handleAutoInterpolate}
                selectedObjectId={selectedObjectId}
            />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative z-10 min-w-0 overflow-hidden">
            <div className="h-16 flex items-center justify-between px-8 bg-white border-b-2 border-gray-400 flex-shrink-0">
                 <div className="flex items-center gap-6">
                    <AnimatedLogo size={56} className="" />
                    <h1 className="font-normal text-xl tracking-wide text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                        AnimaTeX
                    </h1>
                    <span className="text-xs text-gray-500 font-normal tracking-wide">TeXmExDeX Type Tools</span>
                 </div>

                 <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border-2 border-gray-300 cursor-pointer transition-colors text-xs font-normal tracking-wide">
                        <ImageIcon size={14} /> Import Image
                        <input type="file" accept="image/*" onChange={handleAddObject} className="hidden" />
                    </label>
                    <button 
                        onClick={() => { 
                            setIsPlaying(false); 
                            setPlaybackTime(0); 
                            setCurrentFrameIndex(0); 
                        }}
                        className="p-2 hover:bg-gray-100 border-2 border-gray-300 transition-colors text-gray-600 hover:text-gray-900 bg-white"
                        title="Reset Timeline"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button 
                        onClick={togglePlay}
                        className="flex items-center gap-2 px-4 py-2 font-normal transition-colors text-xs tracking-wide border-2 border-gray-900 bg-gray-900 hover:bg-gray-700 text-white"
                    >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        {isPlaying ? 'Stop' : 'Play'}
                    </button>
                 </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-12 relative bg-[#fafaf8]">
                 <div className="relative border-2 border-gray-400 shadow-sm">
                    <Stage 
                        width={project.width}
                        height={project.height}
                        objects={project.objects}
                        currentFrameState={currentObjects}
                        onUpdateObject={handleUpdateObject}
                        selectedObjectId={selectedObjectId}
                        onSelectObject={setSelectedObjectId}
                        isPlaying={isPlaying}
                        onDeleteObject={handleRemoveFromFrame}
                        isExporting={isExporting}
                    />
                 </div>
            </div>
        </div>

        {/* Right Sidebar - Properties */}
        <PropertyPanel 
            selectedObjectState={selectedObjectState}
            onUpdateObject={(update) => selectedObjectId && handleUpdateObject(selectedObjectId, update)}
            fps={project.fps}
            setFps={(f) => setProject(p => ({ ...p, fps: f }))}
            smoothMotion={project.smoothMotion}
            setSmoothMotion={(s) => setProject(p => ({ ...p, smoothMotion: s }))}
            onExport={handleExportGif}
            isExporting={isExporting}
            objects={project.objects}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
            onDeleteLayer={handleDeleteLayer}
        />
    </div>
  );
};

export default App;