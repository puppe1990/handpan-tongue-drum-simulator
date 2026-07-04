import React, { useState, useEffect, useRef } from 'react';
import { engine, SCALE_PRESETS } from './audio/Engine';
import { historyManager } from './audio/History';
import { DrumType, NoteConfig, PresetData } from './types';

// Component Imports
import DrumModel from './components/DrumModel';
import Sequencer from './components/Sequencer';
import Looper from './components/Looper';
import Dsplab from './components/Dsplab';
import MidiSettings from './components/MidiSettings';
import CloudLibrary from './components/CloudLibrary';
import AutomationPanel from './components/AutomationPanel';

// Icons
import {
  Sparkles,
  RotateCcw,
  Sliders,
  RefreshCw,
  FolderOpen,
  Download,
  Upload,
  Layers,
  SlidersHorizontal,
  Cable,
  Volume2,
  CloudLightning,
  Music,
  Waves,
  Undo,
  Redo
} from 'lucide-react';

export default function App() {
  const [drumType, setDrumType] = useState<DrumType>(engine.drumType);
  const [notes, setNotes] = useState<NoteConfig[]>(engine.notes);
  const [scaleName, setScaleName] = useState(engine.scaleName);
  const [activeTab, setActiveTab] = useState<'sequencer' | 'looper' | 'dsp' | 'midi' | 'cloud' | 'automation'>('sequencer');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    // Save initial state
    historyManager.saveState();

    const handleHistoryChange = () => {
      setCanUndo(historyManager.canUndo());
      setCanRedo(historyManager.canRedo());
      // Sync local reactive states with Engine values
      setDrumType(engine.drumType);
      setNotes([...engine.notes]);
      setScaleName(engine.scaleName);
    };

    historyManager.onHistoryChange = handleHistoryChange;
    // Set initial values
    handleHistoryChange();

    return () => {
      historyManager.onHistoryChange = null;
    };
  }, []);

  // Analyzer Visualizer Canvas Ref
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load / Setup Audio Context on first interaction
  const handleInteraction = () => {
    engine.init();
  };

  useEffect(() => {
    // Standard initialization of Web Audio Analyzer Reactivity
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    engine.onAnalyserUpdate = (dataArray) => {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient
      const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#f59e0b'); // amber-500
      gradient.addColorStop(0.5, '#10b981'); // emerald-500
      gradient.addColorStop(1, '#6366f1'); // indigo-500

      canvasCtx.fillStyle = gradient;

      const barWidth = (canvas.width / dataArray.length) * 2.2;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.95;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1.5, barHeight);
        x += barWidth;
      }
    };

    return () => {
      engine.onAnalyserUpdate = null;
    };
  }, []);

  const handleDrumTypeChange = (type: DrumType) => {
    historyManager.saveState();
    engine.setDrumType(type);
    setDrumType(type);
    setNotes([...engine.notes]);
  };

  const handleScaleChange = (name: string) => {
    const scale = SCALE_PRESETS.find(s => s.name === name);
    if (scale) {
      historyManager.saveState();
      engine.loadDefaultNotes(scale);
      setScaleName(name);
      setNotes([...engine.notes]);
    }
  };

  const handleReset = () => {
    historyManager.saveState();
    const activeScale = SCALE_PRESETS.find(s => s.name === scaleName) || SCALE_PRESETS[0];
    engine.loadDefaultNotes(activeScale);
    setNotes([...engine.notes]);
  };

  // --- Preset JSON Import / Export ---
  const handleExportPreset = () => {
    const preset = engine.exportPreset(`Preset_${scaleName}_${Date.now()}`);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(preset, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${preset.name.toLowerCase().replace(/\s+/g, '_')}.json`);
    dlAnchorElem.click();
  };

  const handleImportPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed: PresetData = JSON.parse(event.target?.result as string);
          historyManager.saveState();
          engine.importPreset(parsed);

          // Update local state to sync with imported configs
          setDrumType(engine.drumType);
          setScaleName(engine.scaleName);
          setNotes([...engine.notes]);
        } catch (err) {
          alert("Error parsing Preset file. Please upload a valid JSON configuration.");
        }
      };
    }
  };

  return (
    <div
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      className="min-h-screen bg-zinc-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950"
    >
      {/* 1. HEADER */}
      <header className="border-b border-zinc-900 bg-zinc-950/85 backdrop-blur-md sticky top-0 z-50 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-indigo-600 p-[1.5px] shadow-lg shadow-emerald-500/5">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-100">Handpan & Tongue Drum</h1>
                <span className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono">
                  ULTRA-LOW LATENCY
                </span>
              </div>
              <p className="text-xs text-slate-400">Professional physical synthesis modeling and live performance loop station</p>
            </div>
          </div>

          {/* Quick preset and file controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Undo */}
            <button
              onClick={() => historyManager.undo()}
              disabled={!canUndo}
              id="btn-undo"
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all ${
                canUndo
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-slate-200 cursor-pointer shadow-sm'
                  : 'bg-zinc-950 border-zinc-900 text-slate-600 cursor-not-allowed opacity-45'
              }`}
              title="Undo last action"
            >
              <Undo className="w-3.5 h-3.5" />
              Undo
            </button>

            {/* Redo */}
            <button
              onClick={() => historyManager.redo()}
              disabled={!canRedo}
              id="btn-redo"
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all ${
                canRedo
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-slate-200 cursor-pointer shadow-sm'
                  : 'bg-zinc-950 border-zinc-900 text-slate-600 cursor-not-allowed opacity-45'
              }`}
              title="Redo last undone action"
            >
              <Redo className="w-3.5 h-3.5" />
              Redo
            </button>

            <div className="w-[1px] h-5 bg-zinc-800 mx-1 hidden sm:block" />

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 transition-all"
              title="Reset notes to scale default parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Scale
            </button>

            {/* Presets Export */}
            <button
              onClick={handleExportPreset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Save Preset
            </button>

            {/* Presets Import */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-xs font-semibold text-slate-300 hover:text-slate-100 transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Load Preset
              <input
                type="file"
                accept=".json"
                onChange={handleImportPreset}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        {/* Top interactive controller deck (Type and Scale) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6">
          {/* Drum Type selector */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block">Instrument Architecture</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDrumTypeChange('handpan')}
                className={`py-4 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-center
                  ${drumType === 'handpan'
                    ? 'bg-gradient-to-b from-slate-900 to-zinc-950 border-amber-500/80 text-amber-400 shadow-md shadow-amber-500/5'
                    : 'bg-zinc-900/30 hover:bg-zinc-900/60 border-zinc-850 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${drumType === 'handpan' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-700'}`} />
                <span className="text-sm font-bold tracking-wide">Pantam / Handpan</span>
                <span className="text-[10px] font-mono text-slate-500">1:2:3 Harmonic Overtone Matrix</span>
              </button>

              <button
                onClick={() => handleDrumTypeChange('tongue')}
                className={`py-4 rounded-2xl flex flex-col items-center gap-1.5 border transition-all text-center
                  ${drumType === 'tongue'
                    ? 'bg-gradient-to-b from-indigo-950/40 to-neutral-950 border-indigo-500/80 text-indigo-400 shadow-md shadow-indigo-500/5'
                    : 'bg-zinc-900/30 hover:bg-zinc-900/60 border-zinc-850 text-slate-400 hover:text-slate-200'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${drumType === 'tongue' ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-700'}`} />
                <span className="text-sm font-bold tracking-wide">Steel Tongue Drum</span>
                <span className="text-[10px] font-mono text-slate-500">Enhanced Metallic Resonance Bloom</span>
              </button>
            </div>
          </div>

          {/* Scale preset selector */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block">Harmonic Scale Tuning</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCALE_PRESETS.map((scale) => (
                <button
                  key={scale.name}
                  onClick={() => handleScaleChange(scale.name)}
                  className={`px-3 py-3 rounded-xl border text-xs font-semibold text-center transition-all flex flex-col justify-between items-center h-[76px]
                    ${scaleName === scale.name
                      ? 'bg-zinc-900 border-emerald-500/60 text-emerald-400 shadow-md'
                      : 'bg-zinc-900/30 hover:bg-zinc-900/60 border-zinc-850 text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <span className="font-bold tracking-wide">{scale.name}</span>
                  <span className="text-[10px] font-mono opacity-70 block mt-1">{scale.key}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Core performance area splitting Visual model and Control racks */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Virtual Instrument and Visualizers (5 cols) */}
          <div className="xl:col-span-5 space-y-6 flex flex-col">
            <div className="bg-zinc-950/50 border border-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex-1">
              {/* Decorative faint background wave graph */}
              <div className="absolute top-2 right-4 text-[10px] font-mono text-zinc-800 tracking-widest uppercase pointer-events-none">
                Stereo spectrum
              </div>

              {/* Real-time spectrum bar visualizer */}
              <div className="w-full h-14 bg-zinc-950 border border-zinc-900/80 rounded-2xl overflow-hidden p-0.5">
                <canvas
                  ref={visualizerCanvasRef}
                  width={420}
                  height={52}
                  className="w-full h-full rounded-[14px]"
                />
              </div>

              {/* The gorgeous Interactive Drum */}
              <DrumModel
                notes={notes}
                drumType={drumType}
                onNoteTriggered={(id) => {
                  // Reactive light up on triggering
                }}
              />
            </div>
          </div>

          {/* Right: Rich Feature Tabs (7 cols) */}
          <div className="xl:col-span-7 space-y-6">
            {/* Primary control navigation tab row */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-900/30 p-1.5 rounded-2xl border border-zinc-900">
              <button
                onClick={() => setActiveTab('sequencer')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                  ${activeTab === 'sequencer'
                    ? 'bg-emerald-400 text-zinc-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-900/50'
                  }`}
              >
                <Music className="w-3.5 h-3.5" />
                Sequencer
              </button>

              <button
                onClick={() => setActiveTab('looper')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                  ${activeTab === 'looper'
                    ? 'bg-rose-500 text-slate-100 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-900/50'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Looper & Rec
              </button>

              <button
                onClick={() => setActiveTab('dsp')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                  ${activeTab === 'dsp'
                    ? 'bg-purple-500 text-slate-100 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-900/50'
                  }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                DSP Lab
              </button>

              <button
                onClick={() => setActiveTab('automation')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                  ${activeTab === 'automation'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-900/50'
                  }`}
              >
                <Waves className="w-3.5 h-3.5" />
                Modulation
              </button>

              <button
                onClick={() => setActiveTab('midi')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                  ${activeTab === 'midi'
                    ? 'bg-blue-500 text-slate-100 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-900/50'
                  }`}
              >
                <Cable className="w-3.5 h-3.5" />
                Web MIDI
              </button>

              <button
                onClick={() => setActiveTab('cloud')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2
                  ${activeTab === 'cloud'
                    ? 'bg-sky-500 text-zinc-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-900/50'
                  }`}
              >
                <CloudLightning className="w-3.5 h-3.5" />
                Cloud Scales
              </button>
            </div>

            {/* Render selected module panel */}
            <div className="transition-all duration-300">
              {activeTab === 'sequencer' && <Sequencer notes={notes} />}
              {activeTab === 'looper' && <Looper />}
              {activeTab === 'dsp' && <Dsplab notes={notes} onNotesUpdated={(updated) => setNotes(updated)} />}
              {activeTab === 'midi' && <MidiSettings />}
              {activeTab === 'cloud' && (
                <CloudLibrary
                  onPresetLoaded={(cloudNotes, cloudType, cloudScale) => {
                    setNotes([...cloudNotes]);
                    setDrumType(cloudType);
                    setScaleName(cloudScale);
                  }}
                />
              )}
              {activeTab === 'automation' && <AutomationPanel />}
            </div>
          </div>
        </div>
      </main>

      {/* 3. FOOTER INFO */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Handpan and Steel Tongue Drum Virtual Soundboard. Built in full compliance with low latency requirements.</p>
          <div className="flex gap-4 font-mono text-[10px]">
            <span>ENGINE: WEB AUDIO API</span>
            <span>MIDI: WEB MIDI ACCESS</span>
            <span>PCM: 16-BIT STEREO WAV</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
