import React, { useState, useEffect, useRef } from 'react';
import { engine } from '../audio/Engine';
import { Disc, Play, Square, Circle, Trash2, Download, RefreshCw, AudioLines } from 'lucide-react';

export default function Looper() {
  // Live Event Looper States
  const [looperRecording, setLooperRecording] = useState(engine.looperRecording);
  const [looperPlaying, setLooperPlaying] = useState(engine.looperPlaying);
  const [hasEvents, setHasEvents] = useState(engine.looperEvents.length > 0);

  // WAV Recording States
  const [isWavRecording, setIsWavRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check looper events periodically to update visual UI
    const interval = setInterval(() => {
      setHasEvents(engine.looperEvents.length > 0);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // --- Live Midi Event Looper Handlers ---
  const handleToggleLooperRecord = () => {
    if (looperRecording) {
      engine.stopLooperRecording();
      setLooperRecording(false);
    } else {
      engine.startLooperRecording();
      setLooperRecording(true);
      setLooperPlaying(true);
    }
  };

  const handleToggleLooperPlay = () => {
    if (looperPlaying) {
      engine.stopLooperPlayback();
      setLooperPlaying(false);
      setLooperRecording(false);
    } else {
      engine.startLooperPlayback();
      setLooperPlaying(true);
    }
  };

  const handleClearLooper = () => {
    engine.clearLooper();
    setLooperPlaying(false);
    setLooperRecording(false);
    setHasEvents(false);
  };

  // --- Real-Time WAV Master Recorder Handlers ---
  const handleToggleWavRecording = () => {
    if (isWavRecording) {
      // Stop recording and gather standard high-fidelity WAV blob
      const blob = engine.stopAudioRecording();
      setIsWavRecording(false);
      if (blob) {
        setRecordedBlob(blob);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    } else {
      // Start recording
      setRecordedBlob(null);
      setRecordingSeconds(0);
      engine.startAudioRecording();
      setIsWavRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const downloadWav = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handpan_tongue_jam_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Realtime Event Looper */}
      <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-wide">Dynamic MIDI Looper</h2>
              <p className="text-xs text-slate-400">Overdub and layer multiple live taps flawlessly</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Press <strong>Record</strong> and start tapping notes. Tap elements will be captured in an 8-second cyclical loop and layered seamlessly, preserving original tap velocity and tone.
          </p>

          {/* Looper Visual Info */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="text-slate-400">Loop Status:</span>
              <span className={looperRecording ? 'text-rose-400 font-bold flex items-center gap-1.5' : looperPlaying ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {looperRecording && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                {looperRecording ? 'Recording & Playback' : looperPlaying ? 'Playing' : 'Stopped'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Stacked Layers:</span>
              <span className="text-slate-200">{engine.looperEvents.length} events</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleToggleLooperRecord}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md
              ${looperRecording
                ? 'bg-rose-500 hover:bg-rose-600 text-slate-100 ring-2 ring-rose-400/25'
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-400 hover:text-rose-300'
              }`}
          >
            <Circle className={`w-3.5 h-3.5 ${looperRecording ? 'fill-current animate-pulse' : ''}`} />
            {looperRecording ? 'Stop Looper' : 'Record Loop'}
          </button>

          <button
            onClick={handleToggleLooperPlay}
            disabled={!hasEvents}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed
              ${looperPlaying
                ? 'bg-indigo-500 text-slate-100 ring-2 ring-indigo-400/25'
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-300 hover:text-slate-100'
              }`}
          >
            {looperPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {looperPlaying ? 'Stop Loop' : 'Play Loop'}
          </button>

          <button
            onClick={handleClearLooper}
            disabled={!hasEvents}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Clear loop"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* High Fidelity Audio WAV Master Exporter */}
      <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-400">
              <AudioLines className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-wide">Master Audio Recorder</h2>
              <p className="text-xs text-slate-400">Capture direct soundboard mix to studio-grade WAV</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Record your entire session – including background sequencers, loop stacks, effects tweaks, and live play. Captures high-definition stereophonic outputs.
          </p>

          {/* Record Display */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isWavRecording ? 'bg-rose-500 animate-ping' : 'bg-zinc-700'}`} />
              <span className="font-mono text-lg font-bold text-slate-200">
                {formatTime(recordingSeconds)}
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              16-bit Stereo PCM
            </span>
          </div>
        </div>

        {/* WAV Control Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleToggleWavRecording}
            className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md
              ${isWavRecording
                ? 'bg-rose-500 text-slate-100 animate-pulse ring-2 ring-rose-400/20'
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-400 hover:text-rose-300'
              }`}
          >
            <Disc className={`w-4 h-4 ${isWavRecording ? 'animate-spin' : ''}`} />
            {isWavRecording ? 'Stop Recording' : 'Start Audio Capture'}
          </button>

          <button
            onClick={downloadWav}
            disabled={!recordedBlob}
            className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3 bg-emerald-400 hover:bg-emerald-500 text-zinc-950 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-400/5"
          >
            <Download className="w-4 h-4" />
            Export WAV file
          </button>
        </div>
      </div>
    </div>
  );
}
