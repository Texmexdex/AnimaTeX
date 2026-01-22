import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Layers, Settings, Download, Activity, FlipHorizontal, Square, MousePointerClick, Trash2 } from 'lucide-react';
import { ObjectState, AnimObject } from '../types';

interface PropertyPanelProps {
  selectedObjectState: ObjectState | null;
  onUpdateObject: (update: Partial<ObjectState>) => void;
  fps: number;
  setFps: (fps: number) => void;
  smoothMotion: boolean;
  setSmoothMotion: (enabled: boolean) => void;
  onExport: () => void;
  isExporting: boolean;
  objects: AnimObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onDeleteLayer: (id: string) => void;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-4 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-wider text-gray-300"
      >
        <div className="flex items-center gap-2">
            {icon} {title}
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedObjectState,
  onUpdateObject,
  fps,
  setFps,
  smoothMotion,
  setSmoothMotion,
  onExport,
  isExporting,
  objects,
  selectedObjectId,
  onSelectObject,
  onDeleteLayer
}) => {
  return (
    <div 
      id="property-panel" 
      className="w-72 bg-black/20 backdrop-blur-md border-l border-white/10 h-full overflow-y-auto p-4 flex flex-col gap-2 flex-shrink-0"
    >
      <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
        Animatrix
      </h2>

      {/* Global Settings */}
      <Section title="Settings" icon={<Settings size={14} />}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-400 block">Frame Rate (FPS)</label>
            <input 
                type="range" 
                min="1" 
                max="60" 
                value={fps} 
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full accent-blue-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-right text-xs font-mono">{fps} FPS</div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 flex items-center gap-2">
                <Activity size={12} /> Smooth Motion
            </label>
            <button
                onClick={() => setSmoothMotion(!smoothMotion)}
                className={`w-10 h-5 rounded-full relative transition-colors ${smoothMotion ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${smoothMotion ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
          <p className="text-[10px] text-gray-500">
            Enables interpolation between keyframes for fluid movement.
          </p>
        </div>
      </Section>
      
      {/* Layers Panel */}
      <Section title="Layers" icon={<Layers size={14} />}>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
            {objects.length === 0 && <p className="text-[10px] text-gray-500 italic">No objects added</p>}
            {objects.map((obj) => (
                <div 
                    key={obj.id} 
                    className={`
                        w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors group
                        ${selectedObjectId === obj.id 
                            ? 'bg-blue-600/30 border border-blue-500/50' 
                            : 'hover:bg-white/10'}
                    `}
                >
                    <button
                        onClick={() => onSelectObject(obj.id)}
                        className="flex-1 flex items-center gap-3 text-left overflow-hidden"
                    >
                        <div className="w-6 h-6 rounded bg-black/40 p-0.5 border border-white/10 flex-shrink-0">
                            <img src={obj.src} className="w-full h-full object-contain" alt="" />
                        </div>
                        <span className={`truncate flex-1 ${selectedObjectId === obj.id ? 'text-white' : 'text-gray-400'}`}>{obj.name}</span>
                        {selectedObjectId === obj.id && <MousePointerClick size={12} className="opacity-50 flex-shrink-0" />}
                    </button>
                    <button 
                        onClick={() => onDeleteLayer(obj.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Asset from Project"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            ))}
        </div>
      </Section>

      {/* Object Properties */}
      {selectedObjectState ? (
        <Section title="Transform" icon={<Square size={14} />}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">X Position</label>
              <input 
                type="number" 
                value={Math.round(selectedObjectState.x)} 
                onChange={(e) => onUpdateObject({ x: Number(e.target.value) })}
                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Y Position</label>
              <input 
                type="number" 
                value={Math.round(selectedObjectState.y)} 
                onChange={(e) => onUpdateObject({ y: Number(e.target.value) })}
                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Rotation</label>
              <input 
                type="number" 
                value={Math.round(selectedObjectState.rotation)} 
                onChange={(e) => onUpdateObject({ rotation: Number(e.target.value) })}
                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Opacity</label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                max="1"
                value={selectedObjectState.opacity} 
                onChange={(e) => onUpdateObject({ opacity: Number(e.target.value) })}
                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>
             <div className="col-span-2">
              <label className="text-[10px] text-gray-500 block mb-1">Z-Index (Layer)</label>
              <input 
                type="number" 
                value={selectedObjectState.zIndex} 
                onChange={(e) => onUpdateObject({ zIndex: Number(e.target.value) })}
                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
              />
            </div>
            
            <div className="col-span-2 pt-2 border-t border-white/10 mt-2">
                <label className="text-[10px] text-gray-500 block mb-1">Actions</label>
                <button 
                    onClick={() => onUpdateObject({ flipX: !selectedObjectState.flipX })}
                    className={`
                        w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs font-bold border transition-colors
                        ${selectedObjectState.flipX 
                            ? 'bg-blue-500/20 border-blue-500 text-blue-200' 
                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}
                    `}
                >
                    <FlipHorizontal size={12} /> {selectedObjectState.flipX ? 'Mirrored' : 'Mirror Object'}
                </button>
            </div>
          </div>
        </Section>
      ) : (
        <div className="p-4 rounded-lg border border-dashed border-white/10 text-center text-xs text-gray-500">
            Select an object to edit properties
        </div>
      )}

      {/* Export */}
      <div className="mt-auto">
        <button
            onClick={onExport}
            disabled={isExporting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
             {isExporting ? (
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
             ) : <Download size={16} />}
             Export GIF
        </button>
      </div>

    </div>
  );
};

export default PropertyPanel;