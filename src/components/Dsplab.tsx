import React, { useState, useEffect } from 'react';
import { engine } from '../audio/Engine';
import { historyManager } from '../audio/History';
import { NoteConfig } from '../types';
import { Sliders, Volume2, Sparkles, Activity, Layers, Repeat } from 'lucide-react';

interface DsplabProps {
  notes: NoteConfig[];
  onNotesUpdated: (updated: NoteConfig[]) => void;
}

export default function Dsplab({ notes, onNotesUpdated }: DsplabProps) {
  // Selected note for fine tuning
  const [selectedNoteId, setSelectedNoteId] = useState<number>(0);

  // Master Reverb states
  const [reverbMix, setReverbMix] = useState(engine.reverbMix);
  const [reverbRoomSize, setReverbRoomSize] = useState(engine.reverbRoomSize);
  const [reverbDamping, setReverbDamping] = useState(engine.reverbDamping);

  // Master Compressor states
  const [compThreshold, setCompThreshold] = useState(engine.compressorThreshold);
  const [compRatio, setCompRatio] = useState(engine.compressorRatio);
  const [compAttack, setCompAttack] = useState(engine.compressorAttack);
  const [compRelease, setCompRelease] = useState(engine.compressorRelease);

  // Selected note states
  const selectedNote = notes[selectedNoteId];

  // Refresh controls when notes or master values change
  useEffect(() => {
    setReverbMix(engine.reverbMix);
    setReverbRoomSize(engine.reverbRoomSize);
    setReverbDamping(engine.reverbDamping);
    setCompThreshold(engine.compressorThreshold);
    setCompRatio(engine.compressorRatio);
    setCompAttack(engine.compressorAttack);
    setCompRelease(engine.compressorRelease);
  }, [notes]);

  const updateMasterReverb = (mix: number, size: number, damp: number) => {
    engine.reverbMix = mix;
    engine.reverbRoomSize = size;
    engine.reverbDamping = damp;
    engine.updateReverbParams();

    setReverbMix(mix);
    setReverbRoomSize(size);
    setReverbDamping(damp);
  };

  const updateMasterCompressor = (threshold: number, ratio: number, attack: number, release: number) => {
    engine.compressorThreshold = threshold;
    engine.compressorRatio = ratio;
    engine.compressorAttack = attack;
    engine.compressorRelease = release;
    engine.updateCompressor();

    setCompThreshold(threshold);
    setCompRatio(ratio);
    setCompAttack(attack);
    setCompRelease(release);
  };

  const updateSelectedNoteField = <K extends keyof NoteConfig>(field: K, value: NoteConfig[K]) => {
    const updatedNotes = notes.map(n => {
      if (n.id === selectedNoteId) {
        return { ...n, [field]: value };
      }
      return n;
    });
    onNotesUpdated(updatedNotes);
    engine.notes = updatedNotes;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* 1. MASTER REVERB LAB */}
      <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-wide">Schroeder Algorithmic Reverb</h2>
              <p className="text-[11px] text-slate-400">Simulate perfect spherical iron plate resonance</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Mix Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Reverb Wet Mix</span>
                <span className="text-purple-400 font-bold">{(reverbMix * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={reverbMix}
                onPointerDown={() => historyManager.saveState()}
                onChange={(e) => updateMasterReverb(Number(e.target.value), reverbRoomSize, reverbDamping)}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Room Size Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Resonant Room Size</span>
                <span className="text-purple-400 font-bold">{(reverbRoomSize * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.98"
                step="0.01"
                value={reverbRoomSize}
                onPointerDown={() => historyManager.saveState()}
                onChange={(e) => updateMasterReverb(reverbMix, Number(e.target.value), reverbDamping)}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Damping Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">High-Freq Damping</span>
                <span className="text-purple-400 font-bold">{(reverbDamping * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={reverbDamping}
                onPointerDown={() => historyManager.saveState()}
                onChange={(e) => updateMasterReverb(reverbMix, reverbRoomSize, Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-900/40 text-[10px] font-mono text-slate-500">
          Reverberation utilizes 4 coprime comb feedforward paths in series with 2 allpass diffusers to maximize natural metallic density.
        </div>
      </div>

      {/* 2. MASTER DYNAMICS COMPRESSOR */}
      <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-wide">Dynamics Compressor / Glue</h2>
              <p className="text-[11px] text-slate-400">Warm peaks, sustain notes, and glue overall mix</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Threshold</span>
                <span className="text-emerald-400 font-bold">{compThreshold} dB</span>
              </div>
              <input
                type="range"
                min="-60"
                max="-5"
                step="1"
                value={compThreshold}
                onPointerDown={() => historyManager.saveState()}
                onChange={(e) => updateMasterCompressor(Number(e.target.value), compRatio, compAttack, compRelease)}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Ratio */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Ratio</span>
                <span className="text-emerald-400 font-bold">{compRatio}:1</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="12"
                step="0.5"
                value={compRatio}
                onPointerDown={() => historyManager.saveState()}
                onChange={(e) => updateMasterCompressor(compThreshold, Number(e.target.value), compAttack, compRelease)}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Attack */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-mono">Attack</span>
                <input
                  type="number"
                  step="0.005"
                  min="0.001"
                  max="0.2"
                  value={compAttack}
                  onFocus={() => historyManager.saveState()}
                  onChange={(e) => updateMasterCompressor(compThreshold, compRatio, Number(e.target.value), compRelease)}
                  className="w-full bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg text-xs font-mono text-slate-200"
                />
              </div>

              {/* Release */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-mono">Release</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.02"
                  max="1.0"
                  value={compRelease}
                  onFocus={() => historyManager.saveState()}
                  onChange={(e) => updateMasterCompressor(compThreshold, compRatio, compAttack, Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg text-xs font-mono text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-900/40 text-[10px] font-mono text-slate-500">
          The master compressor is positioned at the final output node prior to the spectral analyzer to prevent digitial clipping.
        </div>
      </div>

      {/* 3. INDIVIDUAL NOTE LAB */}
      <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between xl:col-span-1">
        {selectedNote && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-100 tracking-wide">Per-Note Synthesizer</h2>
                  <p className="text-[11px] text-slate-400">Tune overtone ratios, envelopes, & sends</p>
                </div>
              </div>
            </div>

            {/* Note Selector buttons */}
            <div className="flex flex-wrap gap-1 mb-5 bg-zinc-900/50 p-1 rounded-xl border border-zinc-900">
              {notes.map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    setSelectedNoteId(n.id);
                    engine.triggerNote(n.id, 0.7);
                  }}
                  className={`flex-1 min-w-[28px] text-center py-1 text-[10px] font-mono font-bold rounded transition-all ${
                    selectedNoteId === n.id
                      ? 'bg-amber-400 text-zinc-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {n.id === 0 ? 'D' : `T${n.id}`}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {/* Volume & Frequency Tuning */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-900">
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Note Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedNote.volume}
                    onPointerDown={() => historyManager.saveState()}
                    onChange={(e) => updateSelectedNoteField('volume', Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Frequency (Hz)</label>
                  <input
                    type="number"
                    min="40"
                    max="1200"
                    step="0.1"
                    value={selectedNote.baseFreq}
                    onFocus={() => historyManager.saveState()}
                    onChange={(e) => updateSelectedNoteField('baseFreq', Number(e.target.value))}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Envelope Controls */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-900">
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Attack (s)</label>
                  <input
                    type="range"
                    min="0.001"
                    max="0.3"
                    step="0.005"
                    value={selectedNote.attack}
                    onPointerDown={() => historyManager.saveState()}
                    onChange={(e) => updateSelectedNoteField('attack', Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 mt-1"
                  />
                  <span className="text-[9px] font-mono text-slate-500">{selectedNote.attack.toFixed(3)}s</span>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Decay/Sustain (s)</label>
                  <input
                    type="range"
                    min="0.2"
                    max="6.0"
                    step="0.1"
                    value={selectedNote.decay}
                    onPointerDown={() => historyManager.saveState()}
                    onChange={(e) => updateSelectedNoteField('decay', Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 mt-1"
                  />
                  <span className="text-[9px] font-mono text-slate-500">{selectedNote.decay.toFixed(1)}s</span>
                </div>
              </div>

              {/* Overtone Ratios */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-900">
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Overtone 2 Ratio</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.01"
                    value={selectedNote.overtoneRatio2}
                    onFocus={() => historyManager.saveState()}
                    onChange={(e) => updateSelectedNoteField('overtoneRatio2', Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-slate-200 font-mono mt-1"
                  />
                  <span className="text-[9px] font-mono text-slate-500">Vol: {(selectedNote.overtoneGain2 * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Overtone 3 Ratio</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    step="0.01"
                    value={selectedNote.overtoneRatio3}
                    onFocus={() => historyManager.saveState()}
                    onChange={(e) => updateSelectedNoteField('overtoneRatio3', Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-slate-200 font-mono mt-1"
                  />
                  <span className="text-[9px] font-mono text-slate-500">Vol: {(selectedNote.overtoneGain3 * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Sends */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Reverb Send</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedNote.reverbSend}
                    onPointerDown={() => historyManager.saveState()}
                    onChange={(e) => updateSelectedNoteField('reverbSend', Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 mt-1"
                  />
                  <span className="text-[9px] font-mono text-slate-500">{(selectedNote.reverbSend * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400">Fine Tune (Cents)</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={selectedNote.fineTune || 0}
                    onPointerDown={() => historyManager.saveState()}
                    onChange={(e) => updateSelectedNoteField('fineTune', Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 mt-1"
                  />
                  <span className="text-[9px] font-mono text-slate-500">{selectedNote.fineTune || 0} cents</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
