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
    <div className="mb-4 border-b border-gray-300 pb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 flex items-center justify-between hover:bg-gray-100 transition-colors text-xs font-normal tracking-wide text-gray-700"
      >
        <div className="flex items-center gap-2">
            {icon} {title}
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && <div className="pt-3 space-y-3">{children}</div>}
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
      className="w-80 bg-[#f5f5f0] border-l border-gray-300 h-full overflow-y-auto p-6 flex flex-col gap-2 flex-shrink-0"
    >
      <h2 className="text-base font-normal text-gray-900 mb-6 tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
        Properties
      </h2>

      {/* Global Settings */}
      <Section title="Settings" icon={<Settings size={14} />}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-600 block font-normal">Frame Rate (FPS)</label>
            <input 
                type="range" 
                min="1" 
                max="60" 
                value={fps} 
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full accent-gray-900 h-1 bg-gray-300 appearance-none cursor-pointer"
            />
            <div className="text-right text-xs font-normal text-gray-700">{fps} FPS</div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600 flex items-center gap-2 font-normal">
                <Activity size={12} /> Smooth Motion
            </label>
            <button
                onClick={() => setSmoothMotion(!smoothMotion)}
                className={`w-10 h-5 relative transition-colors border ${smoothMotion ? 'bg-gray-900 border-gray-900' : 'bg-gray-200 border-gray-300'}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 bg-white transition-all ${smoothMotion ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
          <p className="text-[10px] text-gray-500 font-normal">
            Enables interpolation between keyframes for fluid movement.
          </p>
        </div>
      </Section>
      
      {/* Layers Panel */}
      <Section title="Layers" icon={<Layers size={14} />}>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {objects.length === 0 && <p className="text-[10px] text-gray-500 italic font-normal">No objects added</p>}
            {objects.map((obj) => (
                <div 
                    key={obj.id} 
                    className={`
                        w-full flex items-center gap-2 px-2 py-2 text-xs transition-colors group border
                        ${selectedObjectId === obj.id 
                            ? 'bg-gray-200 border-gray-400' 
                            : 'bg-white border-gray-300 hover:bg-gray-100'}
                    `}
                >
                    <button
                        onClick={() => onSelectObject(obj.id)}
                        className="flex-1 flex items-center gap-3 text-left overflow-hidden"
                    >
                        <div className="w-6 h-6 bg-white p-0.5 border border-gray-300 flex-shrink-0">
                            <img src={obj.src} className="w-full h-full object-contain" alt="" />
                        </div>
                        <span className={`truncate flex-1 font-normal ${selectedObjectId === obj.id ? 'text-gray-900' : 'text-gray-600'}`}>{obj.name}</span>
                        {selectedObjectId === obj.id && <MousePointerClick size={12} className="opacity-50 flex-shrink-0" />}
                    </button>
                    <button 
                        onClick={() => onDeleteLayer(obj.id)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100"
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
              <label className="text-[10px] text-gray-600 block mb-1 font-normal">X Position</label>
              <input 
                type="number" 
                value={Math.round(selectedObjectState.x)} 
                onChange={(e) => onUpdateObject({ x: Number(e.target.value) })}
                className="w-full bg-white border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-gray-500 outline-none font-normal"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-600 block mb-1 font-normal">Y Position</label>
              <input 
                type="number" 
                value={Math.round(selectedObjectState.y)} 
                onChange={(e) => onUpdateObject({ y: Number(e.target.value) })}
                className="w-full bg-white border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-gray-500 outline-none font-normal"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-600 block mb-1 font-normal">Rotation</label>
              <input 
                type="number" 
                value={Math.round(selectedObjectState.rotation)} 
                onChange={(e) => onUpdateObject({ rotation: Number(e.target.value) })}
                className="w-full bg-white border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-gray-500 outline-none font-normal"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-600 block mb-1 font-normal">Opacity</label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                max="1"
                value={selectedObjectState.opacity} 
                onChange={(e) => onUpdateObject({ opacity: Number(e.target.value) })}
                className="w-full bg-white border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-gray-500 outline-none font-normal"
              />
            </div>
             <div className="col-span-2">
              <label className="text-[10px] text-gray-600 block mb-1 font-normal">Z-Index (Layer)</label>
              <input 
                type="number" 
                value={selectedObjectState.zIndex} 
                onChange={(e) => onUpdateObject({ zIndex: Number(e.target.value) })}
                className="w-full bg-white border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-gray-500 outline-none font-normal"
              />
            </div>
            
            <div className="col-span-2 pt-2 border-t border-gray-300 mt-2">
                <label className="text-[10px] text-gray-600 block mb-1 font-normal">Actions</label>
                <button 
                    onClick={() => onUpdateObject({ flipX: !selectedObjectState.flipX })}
                    className={`
                        w-full flex items-center justify-center gap-2 py-2 text-xs font-normal border transition-colors
                        ${selectedObjectState.flipX 
                            ? 'bg-gray-200 border-gray-400 text-gray-900' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}
                    `}
                >
                    <FlipHorizontal size={12} /> {selectedObjectState.flipX ? 'Mirrored' : 'Mirror Object'}
                </button>
            </div>
          </div>
        </Section>
      ) : (
        <div className="p-4 border border-dashed border-gray-300 text-center text-xs text-gray-500 font-normal">
            Select an object to edit properties
        </div>
      )}

      {/* Export */}
      <div className="mt-auto pt-4">
        <button
            onClick={onExport}
            disabled={isExporting}
            className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-sm font-normal transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border border-gray-900 text-white"
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