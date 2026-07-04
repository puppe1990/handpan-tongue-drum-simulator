export type DrumType = 'handpan' | 'tongue';

export interface NoteConfig {
  id: number;
  label: string; // e.g., "D3", "A3"
  baseFreq: number; // fundamental frequency in Hz
  fineTune: number; // cents offset (-100 to 100)
  volume: number; // 0 to 1
  overtoneRatio2: number; // e.g., 2.0 (octave) for handpan, 2.4 for tongue
  overtoneRatio3: number; // e.g., 3.0 (compound fifth) for handpan, 3.8 for tongue
  overtoneGain2: number; // 0 to 1
  overtoneGain3: number; // 0 to 1
  attack: number; // seconds
  decay: number; // seconds
  reverbSend: number; // 0 to 1
  compressorThreshold: number; // -100 to 0 dB
}

export interface ScalePreset {
  name: string;
  key: string;
  description: string;
  ding: string;
  notes: string[];
  frequencies: number[]; // 1 Ding + 8 notes = 9 total notes
}

export interface PresetData {
  name: string;
  drumType: DrumType;
  scaleName: string;
  tempo: number;
  notes: NoteConfig[];
  reverbConfig: {
    roomSize: number; // 0 to 1
    damping: number; // Hz / filter freq
    mix: number; // 0 to 1
  };
  compressorConfig: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
}

export interface StepSequencerState {
  bpm: number;
  stepsCount: number; // 8, 16, or 32
  isPlaying: boolean;
  activeStep: number;
  grid: Record<number, boolean[]>; // noteId (0-8) -> boolean array of length stepsCount
}

export interface CloudSamplePack {
  id: string;
  name: string;
  creator: string;
  downloads: number;
  category: 'Spiritual' | 'Cosmic' | 'Forest' | 'Ocean' | 'Traditional';
  scale: string;
  description: string;
  drumType: DrumType;
  preset: PresetData;
}

export interface MidiMapping {
  noteId: number; // 0 to 8
  midiNote: number; // e.g., 60 for C4
}

export interface AutomationTarget {
  id: string;
  name: string;
  paramPath: 'reverbMix' | 'reverbRoomSize' | 'compressorThreshold' | 'globalDecay' | 'overtoneRatio';
}

export interface LfoState {
  enabled: boolean;
  target: string; // AutomationTarget.id
  frequency: number; // Hz, e.g. 0.1 to 10
  depth: number; // percentage 0 to 1
  waveform: 'sine' | 'triangle' | 'sawtooth';
}
