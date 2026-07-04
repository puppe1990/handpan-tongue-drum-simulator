import React, { useState, useEffect } from 'react';
import { engine } from '../audio/Engine';
import { historyManager } from '../audio/History';
import { NoteConfig } from '../types';
import { Play, Square, Trash2, Shuffle, Music, Flame } from 'lucide-react';

interface SequencerProps {
  notes: NoteConfig[];
}

export default function Sequencer({ notes }: SequencerProps) {
  const [bpm, setBpm] = useState(engine.sequencerState.bpm);
  const [stepsCount, setStepsCount] = useState(engine.sequencerState.stepsCount);
  const [isPlaying, setIsPlaying] = useState(engine.sequencerState.isPlaying);
  const [activeStep, setActiveStep] = useState(engine.sequencerState.activeStep);
  const [grid, setGrid] = useState<Record<number, boolean[]>>(() => {
    // Read from engine grid to preserve state
    return JSON.parse(JSON.stringify(engine.sequencerState.grid));
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    // Listen for engine sequencer step changes
    engine.onSequencerStep = (step) => {
      setActiveStep(step);
    };

    return () => {
      engine.onSequencerStep = null;
    };
  }, []);

  // Keep state updated if engine state changes (e.g., preset imported)
  useEffect(() => {
    setBpm(engine.sequencerState.bpm);
    setStepsCount(engine.sequencerState.stepsCount);
    setIsPlaying(engine.sequencerState.isPlaying);
    setGrid(JSON.parse(JSON.stringify(engine.sequencerState.grid)));
  }, [notes, isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      engine.stopSequencer();
      setIsPlaying(false);
      setActiveStep(-1);
    } else {
      engine.startSequencer();
      setIsPlaying(true);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    const bounded = Math.max(40, Math.min(240, newBpm));
    setBpm(bounded);
    engine.setSequencerBpm(bounded);
  };

  const handleStepsCountChange = (count: number) => {
    historyManager.saveState();
    setStepsCount(count);
    engine.setSequencerStepsCount(count);
    setGrid(JSON.parse(JSON.stringify(engine.sequencerState.grid)));
  };

  const toggleCell = (noteId: number, stepIdx: number) => {
    historyManager.saveState();
    const updatedGrid = { ...grid };
    const currentVal = updatedGrid[noteId][stepIdx];
    updatedGrid[noteId][stepIdx] = !currentVal;
    setGrid(updatedGrid);
    engine.setSequencerGrid(noteId, stepIdx, !currentVal);
  };

  const clearGrid = () => {
    historyManager.saveState();
    const updatedGrid = { ...grid };
    Object.keys(updatedGrid).forEach(key => {
      updatedGrid[Number(key)] = Array(stepsCount).fill(false);
      // Update engine as well
      for (let s = 0; s < stepsCount; s++) {
        engine.setSequencerGrid(Number(key), s, false);
      }
    });
    setGrid(updatedGrid);
  };

  const randomizeGrid = () => {
    historyManager.saveState();
    const updatedGrid = { ...grid };
    Object.keys(updatedGrid).forEach(key => {
      const noteId = Number(key);
      updatedGrid[noteId] = Array(stepsCount).fill(false).map((_, i) => {
        // Higher notes and Ding are slightly less dense to keep it musical
        const density = noteId === 0 ? 0.15 : 0.22;
        const trigger = Math.random() < density;
        engine.setSequencerGrid(noteId, i, trigger);
        return trigger;
      });
    });
    setGrid(updatedGrid);
  };

  return (
    <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Sequencer Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">Rhythm Step Sequencer</h2>
            <p className="text-xs text-slate-400">Program, synchronize, and play customizable drum loops</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* BPM */}
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-400 font-mono">BPM:</span>
            <input
              type="number"
              value={bpm}
              onFocus={() => historyManager.saveState()}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="w-14 bg-transparent border-none text-slate-100 text-sm font-bold focus:outline-none focus:ring-0 font-mono text-center"
            />
            <input
              type="range"
              min="50"
              max="200"
              value={bpm}
              onPointerDown={() => historyManager.saveState()}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="w-20 accent-emerald-500 h-1 cursor-pointer"
            />
          </div>

          {/* Steps selector */}
          <div className="flex rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 p-0.5">
            {[8, 16, 32].map((num) => (
              <button
                key={num}
                onClick={() => handleStepsCountChange(num)}
                className={`px-3 py-1 text-xs font-mono transition-all ${
                  stepsCount === num
                    ? 'bg-emerald-500 text-zinc-950 font-bold rounded-lg'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Play, clear, randomize buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-md ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-slate-100 ring-2 ring-rose-400/20'
                  : 'bg-emerald-400 hover:bg-emerald-500 text-zinc-950 ring-2 ring-emerald-300/15'
              }`}
            >
              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isPlaying ? 'Stop' : 'Start'}
            </button>

            <button
              onClick={randomizeGrid}
              title="Generate Random Rhythm"
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-slate-300 hover:text-emerald-400 transition-all"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              id="btn-clear-all"
              title="Clear All Patterns"
              className="flex items-center gap-2 p-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-slate-300 hover:text-rose-400 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Clear All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sequencer Grid Scroll Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[640px] flex flex-col gap-2">
          {/* Timeline numbers */}
          <div className="flex items-center mb-1">
            <div className="w-24 text-right pr-4 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              Beats
            </div>
            <div className="flex-1 flex justify-between">
              {Array(stepsCount).fill(0).map((_, idx) => {
                const isBeatStart = idx % 4 === 0;
                return (
                  <div
                    key={idx}
                    className={`flex-1 text-center font-mono text-[10px] transition-all py-1 ${
                      activeStep === idx
                        ? 'text-emerald-400 font-bold scale-110'
                        : isBeatStart
                        ? 'text-slate-400 font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    {isBeatStart ? `${idx / 4 + 1}` : `.${idx % 4}`}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pads list and sequencer trigger grid */}
          {notes.map((note) => (
            <div key={note.id} className="flex items-center h-8 group">
              {/* Note Name Handle */}
              <button
                onClick={() => engine.triggerNote(note.id)}
                className="w-24 text-left font-mono text-xs font-semibold px-2 py-1 rounded bg-zinc-900/40 border border-zinc-800/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 transition-all flex justify-between items-center mr-4"
              >
                <span>{note.id === 0 ? 'Ding' : `T${note.id}`}</span>
                <span className="text-[10px] opacity-60 text-slate-400">{note.label.replace(' (Ding)', '')}</span>
              </button>

              {/* Steps row */}
              <div className="flex-1 flex gap-1.5 h-full">
                {Array(stepsCount).fill(0).map((_, stepIdx) => {
                  const isActive = grid[note.id]?.[stepIdx] || false;
                  const isCurrent = activeStep === stepIdx;
                  const isFourth = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => toggleCell(note.id, stepIdx)}
                      className={`flex-1 h-full rounded transition-all focus:outline-none ${
                        isActive
                          ? isCurrent
                            ? 'bg-amber-400 scale-95 shadow-lg shadow-amber-500/20'
                            : 'bg-emerald-400 hover:bg-emerald-300'
                          : isCurrent
                          ? 'bg-zinc-700/60 ring-1 ring-emerald-400/40'
                          : isFourth
                          ? 'bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/30'
                          : 'bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-900/20'
                      }`}
                      title={`Trigger ${note.label} at step ${stepIdx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Click note handles to audition sounds.</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-400" /> Active Step
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-zinc-800" /> Beat Start
          </span>
        </div>
      </div>

      {/* Clear All Confirmation Dialog */}
      {showClearConfirm && (
        <div 
          id="clear-confirm-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Clear Sequencer Patterns?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              This will wipe all active programmed patterns for all notes in the sequencer. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                id="btn-cancel-clear"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-clear"
                onClick={() => {
                  clearGrid();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 text-slate-100 ring-2 ring-rose-400/20 transition-all"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
