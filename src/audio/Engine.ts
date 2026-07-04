import { NoteConfig, DrumType, ScalePreset, PresetData, StepSequencerState, MidiMapping, LfoState } from '../types';
import { audioBufferToWav } from './WavEncoder';

// Default professional scales
export const SCALE_PRESETS: ScalePreset[] = [
  {
    name: 'Celtic Minor',
    key: 'D Minor',
    description: 'Mysterious, deep, and reflective. The classic handpan scale.',
    ding: 'D3',
    notes: ['A3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5'],
    frequencies: [146.83, 220.00, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 523.25]
  },
  {
    name: 'Hijaz',
    key: 'G Phrygian Dominant',
    description: 'Exotic, warm, and Middle Eastern. Highly expressive and cinematic.',
    ding: 'G3',
    notes: ['C4', 'Db4', 'E4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'],
    frequencies: [196.00, 261.63, 277.18, 329.63, 349.23, 392.00, 415.30, 466.16, 523.25]
  },
  {
    name: 'Pygmy',
    key: 'F Minor Pentatonic',
    description: 'Earthly, hypnotic, and tribal. Perfectly balanced for meditative play.',
    ding: 'F3',
    notes: ['Ab3', 'Bb3', 'C4', 'Eb4', 'F4', 'Ab4', 'Bb4', 'C5'],
    frequencies: [174.61, 207.65, 233.08, 261.63, 311.13, 349.23, 415.30, 466.16, 523.25]
  },
  {
    name: 'Akebono',
    key: 'C Pentatonic',
    description: 'Traditional Japanese scale. Highly spiritual, serene, and zen.',
    ding: 'C3',
    notes: ['D3', 'Eb3', 'G3', 'Ab3', 'C4', 'D4', 'Eb4', 'G4'],
    frequencies: [130.81, 146.83, 155.56, 196.00, 207.65, 261.63, 293.66, 311.13, 392.00]
  },
  {
    name: 'Astral G-Major',
    key: 'G Major',
    description: 'Celestial, bright, and uplifting. Excellent for joyful melodies.',
    ding: 'G3',
    notes: ['B3', 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4'],
    frequencies: [196.00, 246.94, 261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88]
  }
];

export class AudioEngine {
  ctx: AudioContext | null = null;
  drumType: DrumType = 'handpan';
  notes: NoteConfig[] = [];
  scaleName: string = 'Celtic Minor';

  // Master Nodes
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyzer: AnalyserNode | null = null;

  // Algorithmic Reverb Nodes
  private reverbWetGain: GainNode | null = null;
  private reverbDryGain: GainNode | null = null;
  private reverbCombs: Array<{ delay: DelayNode; feedback: GainNode; filter: BiquadFilterNode }> = [];
  private reverbAllpasses: Array<{ delay: DelayNode; feedback: GainNode }> = [];

  // Global Effects Settings
  reverbRoomSize = 0.75;
  reverbDamping = 0.4;
  reverbMix = 0.35;

  compressorRatio = 4;
  compressorThreshold = -24;
  compressorAttack = 0.01;
  compressorRelease = 0.15;

  // Active MIDI map
  midiMappings: MidiMapping[] = [];
  midiAccess: any = null;
  onMidiStateChange: (() => void) | null = null;
  midiLearnActiveNoteId: number | null = null; // Note currently learning MIDI

  // Sequencer Variables
  sequencerTimer: NodeJS.Timeout | null = null;
  sequencerState: StepSequencerState = {
    bpm: 110,
    stepsCount: 16,
    isPlaying: false,
    activeStep: -1,
    grid: {}
  };
  onSequencerStep: ((step: number) => void) | null = null;
  private lastSequencerTickTime = 0;

  // Realtime Looper Variables
  looperEvents: Array<{ noteId: number; time: number; duration: number; velocity: number }> = [];
  looperRecording = false;
  looperPlaying = false;
  looperStartTime = 0;
  looperLoopLength = 8; // in seconds
  looperTimer: NodeJS.Timeout | null = null;
  private triggeredTimeouts: any[] = [];

  // Audio Recording (Master Output wav capture)
  private isAudioRecording = false;
  private recordedSamplesLeft: Float32Array[] = [];
  private recordedSamplesRight: Float32Array[] = [];
  private recorderNode: ScriptProcessorNode | null = null;
  onRecordingTimeUpdate: ((seconds: number) => void) | null = null;
  recordingStartTime = 0;

  // Listeners
  onAnalyserUpdate: ((dataArray: Uint8Array) => void) | null = null;
  private animationFrameId: number | null = null;

  // LFO Automation States
  lfoState: LfoState = {
    enabled: false,
    target: 'reverbMix',
    frequency: 1,
    depth: 0.5,
    waveform: 'sine'
  };
  private lfoPhase = 0;
  private lastLfoTickTime = 0;

  constructor() {
    this.loadDefaultNotes(SCALE_PRESETS[0]);
    this.initDefaultSequencer();
    this.initDefaultMidiMappings();
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.setupAudioGraph();
    this.initMidi();
    this.startAnalyserLoop();
    this.startAutomationTimer();
  }

  private setupAudioGraph() {
    if (!this.ctx) return;

    // Master Out & Analyzer
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    this.analyzer = this.ctx.createAnalyser();
    this.analyzer.fftSize = 256;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.updateCompressor();

    // Reverb Mixers
    this.reverbWetGain = this.ctx.createGain();
    this.reverbDryGain = this.ctx.createGain();

    this.reverbDryGain.connect(this.compressor);
    this.reverbWetGain.connect(this.compressor);

    // Build Schroeder Algorithmic Reverb
    this.reverbCombs = [];
    this.reverbAllpasses = [];

    // 4 Coprime Comb filter delay times (s)
    const combDelays = [0.0297, 0.0371, 0.0411, 0.0437];
    for (let i = 0; i < 4; i++) {
      const delay = this.ctx.createDelay();
      delay.delayTime.value = combDelays[i];

      const feedback = this.ctx.createGain();
      feedback.gain.value = this.reverbRoomSize * 0.9;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200 + this.reverbDamping * 12000;

      // Feedback loops
      delay.connect(filter);
      filter.connect(feedback);
      feedback.connect(delay);

      this.reverbCombs.push({ delay, feedback, filter });
    }

    // 2 Series Allpass filters for dispersion
    const allpassDelays = [0.005, 0.0017];
    let allpassSource: AudioNode = this.reverbWetGain;

    for (let i = 0; i < 2; i++) {
      const delay = this.ctx.createDelay();
      delay.delayTime.value = allpassDelays[i];

      const feedback = this.ctx.createGain();
      feedback.gain.value = 0.55; // Diffusion coef

      delay.connect(feedback);
      feedback.connect(delay); // simplistic allpass model

      allpassSource.connect(delay);
      allpassSource = delay;
    }

    // Connect Combs to Wet gain, and Allpass output to Compressor
    this.reverbCombs.forEach(comb => {
      comb.delay.connect(this.reverbWetGain!);
    });
    allpassSource.connect(this.compressor);

    // Dynamic routing to Master Output
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.analyzer);
    this.analyzer.connect(this.ctx.destination);

    // Setup recorder node using ScriptProcessor (2048 sample buffer for reliability)
    this.recorderNode = this.ctx.createScriptProcessor(2048, 2, 2);
    this.recorderNode.onaudioprocess = (e) => {
      if (!this.isAudioRecording) return;
      const left = e.inputBuffer.getChannelData(0);
      const right = e.inputBuffer.getChannelData(1);
      // Clone buffer arrays to save recording data
      this.recordedSamplesLeft.push(new Float32Array(left));
      this.recordedSamplesRight.push(new Float32Array(right));
    };
    this.masterGain.connect(this.recorderNode);
    this.recorderNode.connect(this.ctx.destination);

    this.updateReverbParams();
  }

  loadDefaultNotes(scale: ScalePreset) {
    this.scaleName = scale.name;
    this.notes = scale.frequencies.map((freq, idx) => {
      const isDing = idx === 0;
      return {
        id: idx,
        label: isDing ? `${scale.ding} (Ding)` : scale.notes[idx - 1],
        baseFreq: freq,
        fineTune: 0,
        volume: isDing ? 1.0 : 0.85,
        overtoneRatio2: this.drumType === 'handpan' ? 2.0 : 2.4, // Octave / Octave-ish
        overtoneRatio3: this.drumType === 'handpan' ? 3.0 : 3.8, // Compound fifth / Overtones
        overtoneGain2: this.drumType === 'handpan' ? 0.35 : 0.45,
        overtoneGain3: this.drumType === 'handpan' ? 0.20 : 0.25,
        attack: 0.002,
        decay: this.drumType === 'handpan' ? 1.5 : 2.8, // Tongue drum ringing is significantly longer
        reverbSend: isDing ? 0.45 : 0.35,
        compressorThreshold: -15
      };
    });
  }

  setDrumType(type: DrumType) {
    this.drumType = type;
    // Update active scales tuning profiles instantly
    const activeScale = SCALE_PRESETS.find(s => s.name === this.scaleName) || SCALE_PRESETS[0];
    this.loadDefaultNotes(activeScale);
  }

  private initDefaultSequencer() {
    this.sequencerState.grid = {};
    for (let i = 0; i < 9; i++) {
      this.sequencerState.grid[i] = Array(16).fill(false);
    }
  }

  private initDefaultMidiMappings() {
    // Maps standard keyboard C3 to E4 roughly to our 9 drum note pads
    // Ding (pad 0): MIDI 60 (C4) or MIDI 48 (C3)
    this.midiMappings = [
      { noteId: 0, midiNote: 60 }, // Ding
      { noteId: 1, midiNote: 62 }, // D4
      { noteId: 2, midiNote: 64 }, // E4
      { noteId: 3, midiNote: 65 }, // F4
      { noteId: 4, midiNote: 67 }, // G4
      { noteId: 5, midiNote: 69 }, // A4
      { noteId: 6, midiNote: 71 }, // B4
      { noteId: 7, midiNote: 72 }, // C5
      { noteId: 8, midiNote: 74 }  // D5
    ];
  }

  updateReverbParams() {
    if (!this.ctx || !this.reverbWetGain || !this.reverbDryGain) return;

    this.reverbDryGain.gain.setValueAtTime(1.0 - this.reverbMix * 0.5, this.ctx.currentTime);
    this.reverbWetGain.gain.setValueAtTime(this.reverbMix * 1.2, this.ctx.currentTime);

    // Update individual comb feedback gains
    this.reverbCombs.forEach((comb, idx) => {
      // roomSize maps to feedback gain: 0 to 0.95
      comb.feedback.gain.setTargetAtTime(this.reverbRoomSize * 0.92, this.ctx.currentTime, 0.02);
      // damping maps to filter cutoff frequency
      const cutoff = 200 + this.reverbDamping * 12000;
      comb.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.02);
    });
  }

  updateCompressor() {
    if (!this.ctx || !this.compressor) return;
    this.compressor.threshold.setValueAtTime(this.compressorThreshold, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(this.compressorRatio, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(this.compressorAttack, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(this.compressorRelease, this.ctx.currentTime);
  }

  // Live Sound Synthesis with Overtone Modeling and Impact Noise
  triggerNote(noteId: number, velocity = 0.8) {
    this.init(); // Ensure Web Audio is started

    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const note = this.notes[noteId];
    if (!note) return;

    // Apply cents fine tuning
    const pitchMultiplier = Math.pow(2, (note.fineTune || 0) / 1200);
    const freq = note.baseFreq * pitchMultiplier;

    // Local gain node for note velocity and individual volume settings
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0, now);
    // Envelope attack
    voiceGain.gain.linearRampToValueAtTime(note.volume * velocity * 0.45, now + note.attack);
    // Exponential decay to silence
    voiceGain.gain.exponentialRampToValueAtTime(0.00001, now + note.attack + note.decay);

    // Overtone nodes to emulate handpan / steel tongue physical vibration
    const osc1 = this.ctx.createOscillator();
    // Warm custom timbre
    osc1.type = this.drumType === 'handpan' ? 'sine' : 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    // Overtone 2 (Octave or 2.4th harmonic)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * note.overtoneRatio2, now);
    const overtoneGain2 = this.ctx.createGain();
    overtoneGain2.gain.setValueAtTime(note.overtoneGain2, now);
    osc2.connect(overtoneGain2);
    overtoneGain2.connect(voiceGain);

    // Overtone 3 (Fifth or 3.8th harmonic)
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * note.overtoneRatio3, now);
    const overtoneGain3 = this.ctx.createGain();
    overtoneGain3.gain.setValueAtTime(note.overtoneGain3, now);
    osc3.connect(overtoneGain3);
    overtoneGain3.connect(voiceGain);

    osc1.connect(voiceGain);

    // Brief Wood/Metal impact click / Strike transient (Noise Burst)
    const noiseBuffer = this.createNoiseBuffer();
    if (noiseBuffer) {
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(this.drumType === 'handpan' ? 1200 : 2200, now);
      noiseFilter.Q.setValueAtTime(3, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35 * velocity, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015); // extremely fast decay

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(voiceGain);
      noiseNode.start(now);
      noiseNode.stop(now + 0.05);
    }

    // Dynamic processing per-note compressor option
    const noteCompressor = this.ctx.createDynamicsCompressor();
    noteCompressor.threshold.setValueAtTime(note.compressorThreshold, now);
    noteCompressor.ratio.setValueAtTime(3.5, now);
    noteCompressor.attack.setValueAtTime(0.005, now);
    noteCompressor.release.setValueAtTime(0.1, now);

    // Reverb send gain node
    const reverbSendGain = this.ctx.createGain();
    reverbSendGain.gain.setValueAtTime(note.reverbSend, now);

    // Connect paths
    voiceGain.connect(noteCompressor);
    
    // Path A: Dry Master Bus
    noteCompressor.connect(this.reverbDryGain!);
    
    // Path B: Wet Reverb Bus
    noteCompressor.connect(reverbSendGain);
    this.reverbCombs.forEach(comb => {
      reverbSendGain.connect(comb.delay);
    });

    // Fire oscillators
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    const stopTime = now + note.attack + note.decay + 0.1;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);

    // If recording looper is active, append event
    if (this.looperRecording) {
      const relTime = (this.ctx.currentTime - this.looperStartTime) % this.looperLoopLength;
      this.looperEvents.push({
        noteId,
        time: relTime,
        duration: note.decay,
        velocity
      });
    }
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // --- STEP SEQUENCER IMPLEMENTATION ---
  setSequencerBpm(bpm: number) {
    this.sequencerState.bpm = bpm;
  }

  setSequencerGrid(noteId: number, stepIdx: number, val: boolean) {
    if (this.sequencerState.grid[noteId]) {
      this.sequencerState.grid[noteId][stepIdx] = val;
    }
  }

  setSequencerStepsCount(count: number) {
    this.sequencerState.stepsCount = count;
    // Resize grid arrays to fit
    Object.keys(this.sequencerState.grid).forEach(key => {
      const numKey = Number(key);
      const arr = this.sequencerState.grid[numKey];
      if (arr.length < count) {
        this.sequencerState.grid[numKey] = [...arr, ...Array(count - arr.length).fill(false)];
      } else if (arr.length > count) {
        this.sequencerState.grid[numKey] = arr.slice(0, count);
      }
    });
  }

  startSequencer() {
    this.init();
    if (!this.ctx) return;
    this.sequencerState.isPlaying = true;
    this.lastSequencerTickTime = this.ctx.currentTime;
    this.tickSequencer();
  }

  stopSequencer() {
    this.sequencerState.isPlaying = false;
    this.sequencerState.activeStep = -1;
    if (this.sequencerTimer) {
      clearTimeout(this.sequencerTimer);
      this.sequencerTimer = null;
    }
  }

  private tickSequencer() {
    if (!this.sequencerState.isPlaying || !this.ctx) return;

    const currentStep = (this.sequencerState.activeStep + 1) % this.sequencerState.stepsCount;
    this.sequencerState.activeStep = currentStep;

    if (this.onSequencerStep) {
      this.onSequencerStep(currentStep);
    }

    // Trigger scheduled notes for this step
    this.notes.forEach(note => {
      const active = this.sequencerState.grid[note.id]?.[currentStep];
      if (active) {
        // Trigger with slight velocity variation for more human feeling
        const variance = 0.85 + Math.random() * 0.15;
        this.triggerNote(note.id, variance);
      }
    });

    const stepDuration = 60 / this.sequencerState.bpm / 4; // 16th notes
    const timeToNextStepMs = stepDuration * 1000;

    this.sequencerTimer = setTimeout(() => {
      this.tickSequencer();
    }, timeToNextStepMs);
  }

  // --- EVENT-BASED LOOPER (OVERDUBBING) ---
  startLooperRecording() {
    this.init();
    if (!this.ctx) return;
    this.looperRecording = true;
    this.looperStartTime = this.ctx.currentTime;
    this.looperEvents = [];
    this.startLooperPlayback();
  }

  stopLooperRecording() {
    this.looperRecording = false;
  }

  startLooperPlayback() {
    this.init();
    if (this.looperPlaying) return;
    this.looperPlaying = true;
    this.playbackLooperCycle();
  }

  stopLooperPlayback() {
    this.looperPlaying = false;
    this.looperRecording = false;
    this.clearScheduledLooperTimeouts();
  }

  clearLooper() {
    this.stopLooperPlayback();
    this.looperEvents = [];
  }

  private clearScheduledLooperTimeouts() {
    this.triggeredTimeouts.forEach(t => clearTimeout(t));
    this.triggeredTimeouts = [];
    if (this.looperTimer) {
      clearTimeout(this.looperTimer);
      this.looperTimer = null;
    }
  }

  private playbackLooperCycle() {
    if (!this.looperPlaying) return;

    this.clearScheduledLooperTimeouts();

    // Schedule all loops to fire at offsets
    this.looperEvents.forEach(evt => {
      const triggerTimeMs = evt.time * 1000;
      const t = setTimeout(() => {
        if (this.looperPlaying) {
          this.triggerNote(evt.noteId, evt.velocity);
        }
      }, triggerTimeMs);
      this.triggeredTimeouts.push(t);
    });

    // Schedule next loop cycle
    this.looperTimer = setTimeout(() => {
      this.playbackLooperCycle();
    }, this.looperLoopLength * 1000);
  }

  // --- AUDIO EXPORT (REAL-TIME MASTER CAPTURE) ---
  startAudioRecording() {
    this.init();
    if (this.isAudioRecording || !this.ctx) return;

    this.isAudioRecording = true;
    this.recordedSamplesLeft = [];
    this.recordedSamplesRight = [];
    this.recordingStartTime = this.ctx.currentTime;

    if (this.onRecordingTimeUpdate) {
      this.onRecordingTimeUpdate(0);
    }
  }

  stopAudioRecording(): Blob | null {
    if (!this.isAudioRecording || !this.ctx) return null;
    this.isAudioRecording = false;

    // Build standard audio buffer of exact captured size
    const totalSamples = this.recordedSamplesLeft.reduce((sum, chunk) => sum + chunk.length, 0);
    if (totalSamples === 0) return null;

    const recordingBuffer = this.ctx.createBuffer(2, totalSamples, this.ctx.sampleRate);
    const outLeft = recordingBuffer.getChannelData(0);
    const outRight = recordingBuffer.getChannelData(1);

    let offset = 0;
    for (let i = 0; i < this.recordedSamplesLeft.length; i++) {
      outLeft.set(this.recordedSamplesLeft[i], offset);
      outRight.set(this.recordedSamplesRight[i], offset);
      offset += this.recordedSamplesLeft[i].length;
    }

    // Convert offline captured audio buffer to fully functional WAV Blob
    return audioBufferToWav(recordingBuffer);
  }

  // --- PARAMETER LFO AUTOMATION ENGINE ---
  private startAutomationTimer() {
    this.lastLfoTickTime = performance.now();
    const tick = () => {
      this.processLfoAutomation();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private processLfoAutomation() {
    if (!this.lfoState.enabled || !this.ctx) return;

    const now = performance.now();
    const delta = (now - this.lastLfoTickTime) / 1000; // in seconds
    this.lastLfoTickTime = now;

    // Advance Phase
    this.lfoPhase += delta * this.lfoState.frequency;
    if (this.lfoPhase > 1) this.lfoPhase -= 1;

    // Compute waveform value [-1, 1]
    let value = 0;
    if (this.lfoState.waveform === 'sine') {
      value = Math.sin(this.lfoPhase * Math.PI * 2);
    } else if (this.lfoState.waveform === 'triangle') {
      value = this.lfoPhase < 0.5 ? this.lfoPhase * 4 - 1 : 3 - this.lfoPhase * 4;
    } else if (this.lfoState.waveform === 'sawtooth') {
      value = this.lfoPhase * 2 - 1;
    }

    // Apply scaling depth [0, 1]
    const modulatedMultiplier = (value * this.lfoState.depth + 1) / 2; // scale to [0, 1]

    // Map to specific parameter
    switch (this.lfoState.target) {
      case 'reverbMix': {
        const base = this.reverbMix;
        const modulated = Math.max(0, Math.min(1, base * modulatedMultiplier));
        if (this.reverbWetGain && this.reverbDryGain) {
          this.reverbDryGain.gain.setValueAtTime(1.0 - modulated * 0.5, this.ctx.currentTime);
          this.reverbWetGain.gain.setValueAtTime(modulated * 1.2, this.ctx.currentTime);
        }
        break;
      }
      case 'reverbRoomSize': {
        const base = this.reverbRoomSize;
        const modulated = Math.max(0.1, Math.min(0.98, base * modulatedMultiplier));
        this.reverbCombs.forEach(comb => {
          comb.feedback.gain.setValueAtTime(modulated * 0.92, this.ctx.currentTime);
        });
        break;
      }
      case 'compressorThreshold': {
        // Range: -60 to -5 dB
        const range = -5 - (-60);
        const modulated = -60 + modulatedMultiplier * range;
        if (this.compressor) {
          this.compressor.threshold.setValueAtTime(modulated, this.ctx.currentTime);
        }
        break;
      }
      case 'globalDecay': {
        // Multiply decay times of notes
        this.notes.forEach(note => {
          const baseDecay = this.drumType === 'handpan' ? 1.5 : 2.8;
          note.decay = Math.max(0.2, Math.min(6.0, baseDecay * (0.4 + modulatedMultiplier * 1.5)));
        });
        break;
      }
      case 'overtoneRatio': {
        // Add subtle vibrato / pitch drift to overtone ratios
        this.notes.forEach(note => {
          const baseRatio = this.drumType === 'handpan' ? 2.0 : 2.4;
          note.overtoneRatio2 = baseRatio + (modulatedMultiplier - 0.5) * 0.15;
        });
        break;
      }
    }
  }

  // --- MIDI DEVICE INTEGRATION (WEB MIDI API) ---
  private initMidi() {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      console.warn('Web MIDI not supported in this browser.');
      return;
    }

    navigator.requestMIDIAccess()
      .then(access => {
        this.midiAccess = access;
        access.onstatechange = () => {
          if (this.onMidiStateChange) this.onMidiStateChange();
        };
        // Setup inputs
        const inputs = access.inputs.values();
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
          input.value.onmidimessage = (msg) => this.handleMidiMessage(msg);
        }
        if (this.onMidiStateChange) this.onMidiStateChange();
      })
      .catch(err => {
        console.warn('Could not access MIDI devices:', err);
      });
  }

  getMidiDevices(): string[] {
    if (!this.midiAccess) return [];
    const devices: string[] = [];
    const inputs = this.midiAccess.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
      devices.push(input.value.name || 'Unknown MIDI Device');
    }
    return devices;
  }

  private handleMidiMessage(event: any) {
    const data = event.data;
    const cmd = data[0] >> 4;
    const channel = data[0] & 0xf;
    const type = data[0] & 0xf0; // Channel agnostic status byte
    const note = data[1];
    const velocity = data[2];

    // Status byte values:
    // 0x90: Note On (with velocity > 0)
    // 0x80: Note Off (or velocity = 0)
    if (type === 0x90 && velocity > 0) {
      // If we are in MIDI learn mode
      if (this.midiLearnActiveNoteId !== null) {
        const targetId = this.midiLearnActiveNoteId;
        // Map this MIDI key to the note config
        this.midiMappings = this.midiMappings.filter(m => m.noteId !== targetId);
        this.midiMappings.push({ noteId: targetId, midiNote: note });
        this.midiLearnActiveNoteId = null; // deactivate
        if (this.onMidiStateChange) this.onMidiStateChange();
        this.triggerNote(targetId, velocity / 127);
        return;
      }

      // Check mapping
      const mapping = this.midiMappings.find(m => m.midiNote === note);
      if (mapping) {
        this.triggerNote(mapping.noteId, velocity / 127);
      }
    }
  }

  // --- PRESETS LOADING AND EXPORTS ---
  exportPreset(name: string): PresetData {
    return {
      name,
      drumType: this.drumType,
      scaleName: this.scaleName,
      tempo: this.sequencerState.bpm,
      notes: JSON.parse(JSON.stringify(this.notes)),
      reverbConfig: {
        roomSize: this.reverbRoomSize,
        damping: this.reverbDamping,
        mix: this.reverbMix
      },
      compressorConfig: {
        threshold: this.compressorThreshold,
        ratio: this.compressorRatio,
        attack: this.compressorAttack,
        release: this.compressorRelease
      }
    };
  }

  importPreset(preset: PresetData) {
    this.drumType = preset.drumType;
    this.scaleName = preset.scaleName;
    this.sequencerState.bpm = preset.tempo;
    this.notes = JSON.parse(JSON.stringify(preset.notes));
    this.reverbRoomSize = preset.reverbConfig.roomSize;
    this.reverbDamping = preset.reverbConfig.damping;
    this.reverbMix = preset.reverbConfig.mix;
    this.compressorThreshold = preset.compressorConfig.threshold;
    this.compressorRatio = preset.compressorConfig.ratio;
    this.compressorAttack = preset.compressorConfig.attack;
    this.compressorRelease = preset.compressorConfig.release;

    this.updateReverbParams();
    this.updateCompressor();
  }

  private startAnalyserLoop() {
    if (!this.analyzer) return;
    const bufferLength = this.analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (this.analyzer && this.onAnalyserUpdate) {
        this.analyzer.getByteFrequencyData(dataArray);
        this.onAnalyserUpdate(dataArray);
      }
      this.animationFrameId = requestAnimationFrame(update);
    };
    update();
  }

  destroy() {
    this.stopSequencer();
    this.stopLooperPlayback();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Global active instance of AudioEngine for simple reuse and audio safety across route changes
export const engine = new AudioEngine();
