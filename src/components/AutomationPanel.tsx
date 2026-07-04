import React, { useState, useEffect, useRef } from 'react';
import { engine } from '../audio/Engine';
import { LfoState, AutomationTarget } from '../types';
import { Radio, ToggleLeft, ToggleRight, Settings2, Sparkles } from 'lucide-react';

const MOD_TARGETS: AutomationTarget[] = [
  { id: 'reverbMix', name: 'Reverb Wet Mix', paramPath: 'reverbMix' },
  { id: 'reverbRoomSize', name: 'Resonant Room Size', paramPath: 'reverbRoomSize' },
  { id: 'compressorThreshold', name: 'Compressor Threshold', paramPath: 'compressorThreshold' },
  { id: 'globalDecay', name: 'Global Note Decays', paramPath: 'globalDecay' },
  { id: 'overtoneRatio', name: 'Overtone Pitch Vibrato', paramPath: 'overtoneRatio' }
];

export default function AutomationPanel() {
  const [lfo, setLfo] = useState<LfoState>(engine.lfoState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    // Sync local state
    setLfo({ ...engine.lfoState });
  }, []);

  const updateLfo = <K extends keyof LfoState>(field: K, val: LfoState[K]) => {
    const updated = { ...lfo, [field]: val };
    setLfo(updated);
    engine.lfoState = updated;
  };

  // Render moving wave animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw horizontal baseline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      if (lfo.enabled) {
        // Draw modulated waveform
        ctx.strokeStyle = '#f59e0b'; // Amber-500
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        ctx.beginPath();

        phaseRef.current += (0.012 * lfo.frequency);
        if (phaseRef.current > 1) phaseRef.current -= 1;

        for (let i = 0; i < canvas.width; i++) {
          const evalPhase = (i / canvas.width) * 2 + phaseRef.current;
          const p = evalPhase % 1;

          let val = 0;
          if (lfo.waveform === 'sine') {
            val = Math.sin(p * Math.PI * 2);
          } else if (lfo.waveform === 'triangle') {
            val = p < 0.5 ? p * 4 - 1 : 3 - p * 4;
          } else if (lfo.waveform === 'sawtooth') {
            val = p * 2 - 1;
          }

          // Scale by depth
          const y = (canvas.height / 2) - (val * lfo.depth * (canvas.height / 2.3));
          if (i === 0) {
            ctx.moveTo(i, y);
          } else {
            ctx.lineTo(i, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      } else {
        // Draw flat line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [lfo]);

  return (
    <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Controls */}
        <div className="flex-1 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 tracking-wide">Automated Parameter LFO</h2>
                <p className="text-xs text-slate-400">Map Low-Frequency Oscillations to expand tone depth</p>
              </div>
            </div>

            <button
              onClick={() => updateLfo('enabled', !lfo.enabled)}
              className="focus:outline-none transition-all"
            >
              {lfo.enabled ? (
                <ToggleRight className="w-10 h-10 text-amber-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-600" />
              )}
            </button>
          </div>

          <div className="space-y-4">
            {/* Target Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Modulation Destination</label>
              <select
                value={lfo.target}
                onChange={(e) => updateLfo('target', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                {MOD_TARGETS.map((target) => (
                  <option key={target.id} value={target.id}>{target.name}</option>
                ))}
              </select>
            </div>

            {/* Waveform select */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Oscillator Waveform</label>
              <div className="grid grid-cols-3 gap-2">
                {(['sine', 'triangle', 'sawtooth'] as const).map((wave) => (
                  <button
                    key={wave}
                    onClick={() => updateLfo('waveform', wave)}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all border ${
                      lfo.waveform === wave
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-sm'
                        : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-850 text-slate-400'
                    }`}
                  >
                    {wave}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency and Depth sliders */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Speed (Hz)</span>
                  <span className="text-amber-500 font-bold">{lfo.frequency.toFixed(2)} Hz</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="12.0"
                  step="0.05"
                  value={lfo.frequency}
                  onChange={(e) => updateLfo('frequency', Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Mod Depth</span>
                  <span className="text-amber-500 font-bold">{(lfo.depth * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={lfo.depth}
                  onChange={(e) => updateLfo('depth', Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visualizer Canvas Column */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-mono text-slate-400">Real-Time Oscillation Path</span>
            <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950 p-1 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={360}
                height={150}
                className="w-full h-[150px] rounded-lg"
              />
            </div>
          </div>

          <div className="mt-4 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            Active parameter values will dynamically fluctuate around current preset values based on this LFO curve.
          </div>
        </div>
      </div>
    </div>
  );
}
