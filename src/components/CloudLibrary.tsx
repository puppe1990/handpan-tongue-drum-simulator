import React, { useState } from 'react';
import { engine, SCALE_PRESETS } from '../audio/Engine';
import { CloudSamplePack, DrumType, NoteConfig } from '../types';
import { Cloud, Search, ArrowDownToLine, Flame, Sparkles, Filter, CheckCircle } from 'lucide-react';

interface CloudLibraryProps {
  onPresetLoaded: (notes: NoteConfig[], drumType: DrumType, scaleName: string) => void;
}

// Pre-configured cloud premium sound libraries / sample packs
const CLOUD_LIBRARY_DATA: CloudSamplePack[] = [
  {
    id: 'pack_1',
    name: 'Siberian Forest D-Minor',
    creator: 'Yuri G.',
    downloads: 1420,
    category: 'Forest',
    scale: 'Celtic Minor',
    description: 'Earthy, deep, and heavily resonant. Handcrafted with an organic wood strike transient and extremely long reverb bloom.',
    drumType: 'handpan',
    preset: {
      name: 'Siberian Forest D-Minor',
      drumType: 'handpan',
      scaleName: 'Celtic Minor',
      tempo: 105,
      reverbConfig: { roomSize: 0.88, damping: 0.25, mix: 0.55 },
      compressorConfig: { threshold: -18, ratio: 6.0, attack: 0.008, release: 0.2 },
      notes: [
        { id: 0, label: 'D3', baseFreq: 146.83, fineTune: 0, volume: 1.0, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.45, overtoneGain3: 0.35, attack: 0.002, decay: 2.5, reverbSend: 0.65, compressorThreshold: -15 },
        { id: 1, label: 'A3', baseFreq: 220.00, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.4, overtoneGain3: 0.3, attack: 0.002, decay: 2.2, reverbSend: 0.55, compressorThreshold: -15 },
        { id: 2, label: 'C4', baseFreq: 261.63, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.4, overtoneGain3: 0.3, attack: 0.002, decay: 2.1, reverbSend: 0.55, compressorThreshold: -15 },
        { id: 3, label: 'D4', baseFreq: 293.66, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.4, overtoneGain3: 0.3, attack: 0.002, decay: 2.0, reverbSend: 0.5, compressorThreshold: -15 },
        { id: 4, label: 'E4', baseFreq: 329.63, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.4, overtoneGain3: 0.3, attack: 0.002, decay: 1.9, reverbSend: 0.5, compressorThreshold: -15 },
        { id: 5, label: 'F4', baseFreq: 349.23, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.4, overtoneGain3: 0.3, attack: 0.002, decay: 1.8, reverbSend: 0.5, compressorThreshold: -15 },
        { id: 6, label: 'G4', baseFreq: 392.00, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.4, overtoneGain3: 0.3, attack: 0.002, decay: 1.7, reverbSend: 0.5, compressorThreshold: -15 },
        { id: 7, label: 'A4', baseFreq: 440.00, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.4, overtoneGain3: 0.3, attack: 0.002, decay: 1.6, reverbSend: 0.5, compressorThreshold: -15 },
        { id: 8, label: 'C5', baseFreq: 523.25, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.4, overtoneGain3: 0.3, attack: 0.002, decay: 1.5, reverbSend: 0.5, compressorThreshold: -15 }
      ]
    }
  },
  {
    id: 'pack_2',
    name: 'Desert Wind Hijaz G',
    creator: 'Amir S.',
    downloads: 984,
    category: 'Spiritual',
    scale: 'Hijaz',
    description: 'Cinematic, warm, and highly expressive. Configured with rapid attacks, intense velocity mapping, and custom micro-tuned overtones.',
    drumType: 'handpan',
    preset: {
      name: 'Desert Wind Hijaz G',
      drumType: 'handpan',
      scaleName: 'Hijaz',
      tempo: 120,
      reverbConfig: { roomSize: 0.7, damping: 0.5, mix: 0.35 },
      compressorConfig: { threshold: -12, ratio: 4.5, attack: 0.002, release: 0.15 },
      notes: [
        { id: 0, label: 'G3', baseFreq: 196.00, fineTune: 4, volume: 1.0, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.3, overtoneGain3: 0.2, attack: 0.002, decay: 1.6, reverbSend: 0.4, compressorThreshold: -15 },
        { id: 1, label: 'C4', baseFreq: 261.63, fineTune: -2, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.25, overtoneGain3: 0.18, attack: 0.002, decay: 1.5, reverbSend: 0.3, compressorThreshold: -15 },
        { id: 2, label: 'Db4', baseFreq: 277.18, fineTune: 6, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.25, overtoneGain3: 0.18, attack: 0.002, decay: 1.5, reverbSend: 0.3, compressorThreshold: -15 },
        { id: 3, label: 'E4', baseFreq: 329.63, fineTune: 1, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.25, overtoneGain3: 0.18, attack: 0.002, decay: 1.4, reverbSend: 0.3, compressorThreshold: -15 },
        { id: 4, label: 'F4', baseFreq: 349.23, fineTune: -3, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.25, overtoneGain3: 0.18, attack: 0.002, decay: 1.4, reverbSend: 0.3, compressorThreshold: -15 },
        { id: 5, label: 'G4', baseFreq: 392.00, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.25, overtoneGain3: 0.18, attack: 0.002, decay: 1.3, reverbSend: 0.3, compressorThreshold: -15 },
        { id: 6, label: 'Ab4', baseFreq: 415.30, fineTune: 5, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.25, overtoneGain3: 0.18, attack: 0.002, decay: 1.3, reverbSend: 0.3, compressorThreshold: -15 },
        { id: 7, label: 'Bb4', baseFreq: 466.16, fineTune: 0, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.25, overtoneGain3: 0.18, attack: 0.002, decay: 1.2, reverbSend: 0.3, compressorThreshold: -15 },
        { id: 8, label: 'C5', baseFreq: 523.25, fineTune: -1, volume: 0.85, overtoneRatio2: 2.0, overtoneRatio3: 3.0, overtoneGain2: 0.25, overtoneGain3: 0.18, attack: 0.002, decay: 1.1, reverbSend: 0.3, compressorThreshold: -15 }
      ]
    }
  },
  {
    id: 'pack_3',
    name: 'Cosmic Zenith Akebono',
    creator: 'Nova Labs',
    downloads: 2110,
    category: 'Cosmic',
    scale: 'Akebono',
    description: 'Highly ethereal and dreamy. Leverages heavy algorithmic reverb with custom tuned overtones for a cosmic bell-like space pad effect.',
    drumType: 'tongue',
    preset: {
      name: 'Cosmic Zenith Akebono',
      drumType: 'tongue',
      scaleName: 'Akebono',
      tempo: 90,
      reverbConfig: { roomSize: 0.96, damping: 0.15, mix: 0.7 },
      compressorConfig: { threshold: -26, ratio: 8.0, attack: 0.015, release: 0.35 },
      notes: [
        { id: 0, label: 'C3', baseFreq: 130.81, fineTune: 0, volume: 1.0, overtoneRatio2: 2.4, overtoneRatio3: 3.8, overtoneGain2: 0.6, overtoneGain3: 0.3, attack: 0.005, decay: 4.8, reverbSend: 0.75, compressorThreshold: -20 },
        { id: 1, label: 'D3', baseFreq: 146.83, fineTune: 0, volume: 0.85, overtoneRatio2: 2.4, overtoneRatio3: 3.8, overtoneGain2: 0.5, overtoneGain3: 0.25, attack: 0.005, decay: 4.5, reverbSend: 0.65, compressorThreshold: -20 },
        { id: 2, label: 'Eb3', baseFreq: 155.56, fineTune: 0, volume: 0.85, overtoneRatio2: 2.4, overtoneRatio3: 3.8, overtoneGain2: 0.5, overtoneGain3: 0.25, attack: 0.005, decay: 4.4, reverbSend: 0.65, compressorThreshold: -20 },
        { id: 3, label: 'G3', baseFreq: 196.00, fineTune: 0, volume: 0.85, overtoneRatio2: 2.4, overtoneRatio3: 3.8, overtoneGain2: 0.5, overtoneGain3: 0.25, attack: 0.005, decay: 4.1, reverbSend: 0.65, compressorThreshold: -20 },
        { id: 4, label: 'Ab3', baseFreq: 207.65, fineTune: 0, volume: 0.85, overtoneRatio2: 2.4, overtoneRatio3: 3.8, overtoneGain2: 0.5, overtoneGain3: 0.25, attack: 0.005, decay: 4.0, reverbSend: 0.65, compressorThreshold: -20 },
        { id: 5, label: 'C4', baseFreq: 261.63, fineTune: 0, volume: 0.85, overtoneRatio2: 2.4, overtoneRatio3: 3.8, overtoneGain2: 0.5, overtoneGain3: 0.25, attack: 0.005, decay: 3.8, reverbSend: 0.6, compressorThreshold: -20 },
        { id: 6, label: 'D4', baseFreq: 293.66, fineTune: 0, volume: 0.85, overtoneRatio2: 2.4, overtoneRatio3: 3.8, overtoneGain2: 0.5, overtoneGain3: 0.25, attack: 0.005, decay: 3.6, reverbSend: 0.6, compressorThreshold: -20 },
        { id: 7, label: 'Eb4', baseFreq: 311.13, fineTune: 0, volume: 0.85, overtoneRatio2: 2.4, overtoneRatio3: 3.8, overtoneGain2: 0.5, overtoneGain3: 0.25, attack: 0.005, decay: 3.5, reverbSend: 0.6, compressorThreshold: -20 },
        { id: 8, label: 'G4', baseFreq: 392.00, fineTune: 0, volume: 0.85, overtoneRatio2: 2.4, overtoneRatio3: 3.8, overtoneGain2: 0.5, overtoneGain3: 0.25, attack: 0.005, decay: 3.2, reverbSend: 0.6, compressorThreshold: -20 }
      ]
    }
  },
  {
    id: 'pack_4',
    name: 'Zen Temple Gongs',
    creator: 'Master Kenji',
    downloads: 1850,
    category: 'Traditional',
    scale: 'Akebono',
    description: 'Deep, heavy gong-like resonance. Slow decay, warm low-end weight, and vintage organic compression.',
    drumType: 'tongue',
    preset: {
      name: 'Zen Temple Gongs',
      drumType: 'tongue',
      scaleName: 'Akebono',
      tempo: 80,
      reverbConfig: { roomSize: 0.9, damping: 0.35, mix: 0.45 },
      compressorConfig: { threshold: -20, ratio: 5.0, attack: 0.012, release: 0.3 },
      notes: [
        { id: 0, label: 'C3', baseFreq: 130.81, fineTune: -5, volume: 1.0, overtoneRatio2: 2.38, overtoneRatio3: 3.75, overtoneGain2: 0.55, overtoneGain3: 0.28, attack: 0.008, decay: 5.2, reverbSend: 0.55, compressorThreshold: -15 },
        { id: 1, label: 'D3', baseFreq: 146.83, fineTune: -4, volume: 0.85, overtoneRatio2: 2.38, overtoneRatio3: 3.75, overtoneGain2: 0.48, overtoneGain3: 0.22, attack: 0.008, decay: 4.8, reverbSend: 0.45, compressorThreshold: -15 },
        { id: 2, label: 'Eb3', baseFreq: 155.56, fineTune: -3, volume: 0.85, overtoneRatio2: 2.38, overtoneRatio3: 3.75, overtoneGain2: 0.48, overtoneGain3: 0.22, attack: 0.008, decay: 4.7, reverbSend: 0.45, compressorThreshold: -15 },
        { id: 3, label: 'G3', baseFreq: 196.00, fineTune: -2, volume: 0.85, overtoneRatio2: 2.38, overtoneRatio3: 3.75, overtoneGain2: 0.48, overtoneGain3: 0.22, attack: 0.008, decay: 4.5, reverbSend: 0.45, compressorThreshold: -15 },
        { id: 4, label: 'Ab3', baseFreq: 207.65, fineTune: -1, volume: 0.85, overtoneRatio2: 2.38, overtoneRatio3: 3.75, overtoneGain2: 0.48, overtoneGain3: 0.22, attack: 0.008, decay: 4.4, reverbSend: 0.45, compressorThreshold: -15 },
        { id: 5, label: 'C4', baseFreq: 261.63, fineTune: 0, volume: 0.85, overtoneRatio2: 2.38, overtoneRatio3: 3.75, overtoneGain2: 0.48, overtoneGain3: 0.22, attack: 0.008, decay: 4.2, reverbSend: 0.4, compressorThreshold: -15 },
        { id: 6, label: 'D4', baseFreq: 293.66, fineTune: 1, volume: 0.85, overtoneRatio2: 2.38, overtoneRatio3: 3.75, overtoneGain2: 0.48, overtoneGain3: 0.22, attack: 0.008, decay: 4.0, reverbSend: 0.4, compressorThreshold: -15 },
        { id: 7, label: 'Eb4', baseFreq: 311.13, fineTune: 2, volume: 0.85, overtoneRatio2: 2.38, overtoneRatio3: 3.75, overtoneGain2: 0.48, overtoneGain3: 0.22, attack: 0.008, decay: 3.9, reverbSend: 0.4, compressorThreshold: -15 },
        { id: 8, label: 'G4', baseFreq: 392.00, fineTune: 3, volume: 0.85, overtoneRatio2: 2.38, overtoneRatio3: 3.75, overtoneGain2: 0.48, overtoneGain3: 0.22, attack: 0.008, decay: 3.6, reverbSend: 0.4, compressorThreshold: -15 }
      ]
    }
  }
];

export default function CloudLibrary({ onPresetLoaded }: CloudLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [justLoadedId, setJustLoadedId] = useState<string | null>(null);

  const categories = ['All', 'Spiritual', 'Cosmic', 'Forest', 'Traditional'];

  const handleLoadPack = (pack: CloudSamplePack) => {
    engine.importPreset(pack.preset);
    onPresetLoaded(engine.notes, pack.preset.drumType, pack.preset.scaleName);

    setJustLoadedId(pack.id);
    setTimeout(() => {
      setJustLoadedId(null);
    }, 2000);
  };

  const filteredPacks = CLOUD_LIBRARY_DATA.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pack.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || pack.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-zinc-950/70 border border-zinc-900 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20 text-sky-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">Cloud Scale Explorer</h2>
            <p className="text-xs text-slate-400">Download premium acoustic sound profiles and presets</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search clouds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-sky-500 text-zinc-950 font-bold'
                : 'bg-zinc-900/50 hover:bg-zinc-850 text-slate-400 hover:text-slate-200 border border-zinc-850'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cloud cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPacks.map((pack) => {
          const isJustLoaded = justLoadedId === pack.id;
          return (
            <div key={pack.id} className="bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all group">
              <div className="space-y-2">
                {/* Pack Badges & Downloads */}
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold uppercase">
                      {pack.drumType}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-slate-400 font-semibold uppercase">
                      {pack.category}
                    </span>
                  </div>
                  <span className="text-slate-500">{pack.downloads} downloads</span>
                </div>

                {/* Name */}
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
                  {pack.name}
                </h3>

                {/* Desc */}
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {pack.description}
                </p>

                {/* Scale info */}
                <div className="text-[10px] font-mono text-slate-500 flex gap-4 pt-1">
                  <span>Scale: <strong className="text-slate-300">{pack.scale}</strong></span>
                  <span>Keys: <strong className="text-slate-300">{pack.preset.notes.length} pads</strong></span>
                </div>
              </div>

              {/* Install action button */}
              <button
                onClick={() => handleLoadPack(pack)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm
                  ${isJustLoaded
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700/50 group-hover:bg-sky-500 group-hover:text-zinc-950 group-hover:border-none'
                  }`}
              >
                {isJustLoaded ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Pack Sync Success
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    Load cloud profile
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
