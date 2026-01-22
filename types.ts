export interface AnimObject {
  id: string;
  src: string; // Data URL or Image URL
  name: string;
  type: 'image' | 'svg';
  naturalWidth: number;
  naturalHeight: number;
}

export interface ObjectState {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // Degrees
  opacity: number;
  zIndex: number;
  flipX: boolean; // Horizontal mirror
}

export interface Keyframe {
  id: string;
  index: number; // 0-based index in timeline
  objects: Record<string, ObjectState>; // Map objectId -> state
}

export interface ProjectState {
  fps: number;
  width: number;
  height: number;
  smoothMotion: boolean; // Tweening enabled/disabled
  objects: AnimObject[];
  keyframes: Keyframe[];
}