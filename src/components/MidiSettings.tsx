import React, { useState, useEffect } from 'react';
import { engine } from '../audio/Engine';
import { Cpu, RefreshCw, Key, HelpCircle, AlertCircle } from 'lucide-react';

export default function MidiSettings() {
  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [midiLearnActiveId, setMidiLearnActiveId] = useState<number | null>(null);
  const [mappings, setMappings] = useState(engine.midiMappings);

  const fetchMidiInfo = () => {
    const devices = engine.getMidiDevices();
    setMidiDevices(devices);
    setMappings([...engine.midiMappings]);
  };

  useEffect(() => {
    fetchMidiInfo();
    engine.onMidiStateChange = () => {
      fetchMidiInfo();
      setMidiLearnActiveId(engine.midiLearnActiveNoteId);
    };

    return () => {
      engine.onMidiStateChange = null;
    };
  }, []);

  const handleToggleLearn = (noteId: number) => {
    if (midiLearnActiveId === noteId) {
      engine.midiLearnActiveNoteId = null;
      setMidiLearnActiveId(null);
    } else {
      engine.midiLearnActiveNoteId = noteId;
      setMidiLearnActiveId(noteId);
    }
  };

  const getMidiNoteName = (midiNum: number) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNum / 12) - 1;
    const noteName = notes[midiNum % 12];
    return `${noteName}${octave} (${midiNum})`;
  };

  return (
    <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Device List Column */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 tracking-wide">Web MIDI Integration</h2>
                <p className="text-xs text-slate-400">Connect and sync with external hardware & DAWs</p>
              </div>
            </div>

            <button
              onClick={fetchMidiInfo}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-300 rounded-xl transition-all"
              title="Refresh MIDI devices"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Connected Hardware</h3>
            {midiDevices.length === 0 ? (
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-300 font-semibold">No MIDI devices detected</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Connect an external MIDI controller, keyboard, or launchpad via USB. Ensure your browser is allowed to access MIDI.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {midiDevices.map((device, idx) => (
                  <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-xs text-slate-200 font-bold">{device}</span>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-zinc-900/20 border border-zinc-900/50 rounded-xl p-4 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Universal MIDI Clock Sync</p>
              <p className="leading-relaxed">
                Send notes from your DAW (Abelton Live, Logic, FL Studio, Reaper) or hardware pads on the mapped MIDI Note channels below. Handpan supports velocity sensing to scale strike strength dynamically.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Mapping and Learn Column */}
        <div className="flex-1 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">MIDI Learn & Mapping</h3>

          <div className="bg-zinc-900/20 rounded-xl border border-zinc-900 p-4 max-h-[290px] overflow-y-auto custom-scrollbar space-y-1.5">
            {Array(9).fill(0).map((_, idx) => {
              const mapping = mappings.find(m => m.noteId === idx);
              const isLearning = midiLearnActiveId === idx;

              return (
                <div key={idx} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-900/50 hover:border-zinc-800/80 px-3 py-2 rounded-lg transition-all">
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs text-slate-200 font-mono font-bold">
                      {idx === 0 ? 'Ding (Pad 0)' : `Tone Pad ${idx}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-850">
                      {isLearning ? 'WAITING KEY...' : mapping ? getMidiNoteName(mapping.midiNote) : 'UNMAPPED'}
                    </span>

                    <button
                      onClick={() => handleToggleLearn(idx)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                        isLearning
                          ? 'bg-rose-500 text-slate-100 animate-pulse'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-slate-300 border border-zinc-700/50'
                      }`}
                    >
                      {isLearning ? 'Cancel' : 'Learn'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
