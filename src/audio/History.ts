import { engine } from './Engine';
import { DrumType, NoteConfig } from '../types';

export interface HistorySnapshot {
  drumType: DrumType;
  scaleName: string;
  tempo: number;
  notes: NoteConfig[];
  reverbConfig: {
    roomSize: number;
    damping: number;
    mix: number;
  };
  compressorConfig: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
  sequencerGrid: Record<number, boolean[]>;
}

class HistoryManager {
  private undoStack: HistorySnapshot[] = [];
  private redoStack: HistorySnapshot[] = [];
  private maxDepth = 40;
  private isApplyingHistory = false;

  onHistoryChange: (() => void) | null = null;

  private createSnapshot(): HistorySnapshot {
    return {
      drumType: engine.drumType,
      scaleName: engine.scaleName,
      tempo: engine.sequencerState.bpm,
      notes: JSON.parse(JSON.stringify(engine.notes)),
      reverbConfig: {
        roomSize: engine.reverbRoomSize,
        damping: engine.reverbDamping,
        mix: engine.reverbMix,
      },
      compressorConfig: {
        threshold: engine.compressorThreshold,
        ratio: engine.compressorRatio,
        attack: engine.compressorAttack,
        release: engine.compressorRelease,
      },
      sequencerGrid: JSON.parse(JSON.stringify(engine.sequencerState.grid)),
    };
  }

  // Push current state to undo stack, clear redo stack
  saveState() {
    if (this.isApplyingHistory) return;
    const snapshot = this.createSnapshot();
    
    // Avoid duplicate successive states (simple deep check or fast stringify comparison)
    if (this.undoStack.length > 0) {
      const last = this.undoStack[this.undoStack.length - 1];
      if (JSON.stringify(last) === JSON.stringify(snapshot)) {
        return;
      }
    }

    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    this.redoStack = []; // clear redo on new action

    if (this.onHistoryChange) this.onHistoryChange();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo() {
    if (!this.canUndo()) return;
    
    this.isApplyingHistory = true;
    const currentState = this.createSnapshot();
    this.redoStack.push(currentState);

    const previousState = this.undoStack.pop()!;
    this.applySnapshot(previousState);
    this.isApplyingHistory = false;

    if (this.onHistoryChange) this.onHistoryChange();
  }

  redo() {
    if (!this.canRedo()) return;

    this.isApplyingHistory = true;
    const currentState = this.createSnapshot();
    this.undoStack.push(currentState);

    const nextState = this.redoStack.pop()!;
    this.applySnapshot(nextState);
    this.isApplyingHistory = false;

    if (this.onHistoryChange) this.onHistoryChange();
  }

  private applySnapshot(snap: HistorySnapshot) {
    engine.drumType = snap.drumType;
    engine.scaleName = snap.scaleName;
    engine.sequencerState.bpm = snap.tempo;
    engine.notes = JSON.parse(JSON.stringify(snap.notes));
    engine.reverbRoomSize = snap.reverbConfig.roomSize;
    engine.reverbDamping = snap.reverbConfig.damping;
    engine.reverbMix = snap.reverbConfig.mix;
    engine.compressorThreshold = snap.compressorConfig.threshold;
    engine.compressorRatio = snap.compressorConfig.ratio;
    engine.compressorAttack = snap.compressorConfig.attack;
    engine.compressorRelease = snap.compressorConfig.release;
    engine.sequencerState.grid = JSON.parse(JSON.stringify(snap.sequencerGrid));

    engine.updateReverbParams();
    engine.updateCompressor();
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    if (this.onHistoryChange) this.onHistoryChange();
  }
}

export const historyManager = new HistoryManager();
