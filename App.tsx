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
    <div className="flex h-screen w-screen text-white font-sans overflow-hidden bg-[#0f0c29]">
        <div className="flex-1 flex flex-col relative z-10 min-w-0 overflow-hidden">
            <div className="h-16 flex items-center justify-between px-6 bg-white/5 border-b border-white/10 backdrop-blur-md z-20 shadow-lg flex-shrink-0">
                 <div className="flex items-center gap-4">
                    <AnimatedLogo size={40} className="rounded-xl shadow-lg shadow-purple-500/20" />
                    <h1 className="font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-md">
                        AnimaTeX
                    </h1>
                    <span className="text-xs text-white/50 font-medium tracking-wide">TeXmExDeX Type Tools</span>
                    <div className="h-8 w-px bg-white/10 mx-4" />
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 rounded-lg cursor-pointer transition-all hover:scale-105 text-sm font-bold uppercase tracking-wide border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <ImageIcon size={16} /> Import Image
                        <input type="file" accept="image/*" onChange={handleAddObject} className="hidden" />
                    </label>
                 </div>

                 <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { 
                            setIsPlaying(false); 
                            setPlaybackTime(0); 
                            setCurrentFrameIndex(0); 
                        }}
                        className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        title="Reset Timeline"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button 
                        onClick={togglePlay}
                        className={`
                            flex items-center gap-3 px-8 py-2.5 rounded-full font-bold shadow-lg transition-all hover:scale-105 active:scale-95
                            ${isPlaying 
                                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/30 border border-white/10' 
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 border border-white/10'}
                        `}
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        {isPlaying ? 'STOP' : 'PLAY'}
                    </button>
                 </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative">
                 <div className="shadow-2xl relative">
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
            />
        </div>

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