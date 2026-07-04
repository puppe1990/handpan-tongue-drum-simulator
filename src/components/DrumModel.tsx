import React, { useState, useEffect } from 'react';
import { engine } from '../audio/Engine';
import { NoteConfig, DrumType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DrumModelProps {
  notes: NoteConfig[];
  drumType: DrumType;
  onNoteTriggered?: (noteId: number) => void;
}

export default function DrumModel({ notes, drumType, onNoteTriggered }: DrumModelProps) {
  const [activeNotes, setActiveNotes] = useState<Record<number, boolean>>({});

  const handleTrigger = (id: number) => {
    engine.triggerNote(id);
    if (onNoteTriggered) onNoteTriggered(id);

    // Active visual feedback
    setActiveNotes(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setActiveNotes(prev => ({ ...prev, [id]: false }));
    }, 200);
  };

  // Keyboard support: Map 1-9 to notes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes(document.activeElement?.tagName.toLowerCase() || '')) {
        return;
      }
      const keyMap: Record<string, number> = {
        '1': 0, // Ding
        '2': 1,
        '3': 2,
        '4': 3,
        '5': 4,
        '6': 5,
        '7': 6,
        '8': 7,
        '9': 8
      };
      if (e.key in keyMap) {
        handleTrigger(keyMap[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes]);

  // CSS for interactive drum fields
  const getNotePositionClass = (id: number) => {
    if (id === 0) return 'center-ding';
    // Arrange 8 notes in a perfect circle
    const angle = ((id - 1) * 360) / 8 - 90; // Start from top
    return `note-field note-${id}`;
  };

  const getAngle = (id: number) => {
    if (id === 0) return { x: 0, y: 0 };
    const angleRad = (((id - 1) * 360) / 8 - 90) * (Math.PI / 180);
    const radius = drumType === 'handpan' ? 140 : 130;
    return {
      x: Math.cos(angleRad) * radius,
      y: Math.sin(angleRad) * radius
    };
  };

  // Render Handpan Model with metallic gradients and dimple design
  const renderHandpan = () => {
    return (
      <div className="relative w-full aspect-square max-w-[480px] mx-auto rounded-full bg-radial from-slate-700 via-slate-800 to-zinc-950 p-2 shadow-2xl border border-slate-700/50 flex items-center justify-center">
        {/* Brass outer rim */}
        <div className="absolute inset-2 rounded-full border-4 border-amber-600/35 pointer-events-none opacity-80" />

        {/* Outer shadow overlay */}
        <div className="absolute inset-0 rounded-full bg-radial from-transparent to-black/80 pointer-events-none" />

        {/* Center Ding Note (Pad 0) */}
        {notes[0] && (
          <motion.button
            id={`note-pad-0`}
            whileTap={{ scale: 0.94 }}
            onTouchStart={(e) => {
              e.preventDefault();
              handleTrigger(0);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleTrigger(0);
            }}
            className={`absolute w-36 h-36 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-100 select-none z-20 shadow-inner group
              ${activeNotes[0]
                ? 'bg-amber-400/90 shadow-amber-500/50 ring-4 ring-amber-300'
                : 'bg-gradient-to-br from-zinc-800 via-slate-900 to-zinc-950 hover:from-slate-800 hover:to-zinc-900 border border-slate-700/60'
              }`}
          >
            {/* Center dimple */}
            <div className={`w-12 h-12 rounded-full transition-all duration-150 flex items-center justify-center shadow-lg
              ${activeNotes[0] ? 'bg-amber-300' : 'bg-zinc-950 border border-amber-800/20'}`}
            >
              <span className={`text-[10px] font-mono tracking-wider ${activeNotes[0] ? 'text-zinc-950 font-bold' : 'text-amber-500/80'}`}>DING</span>
            </div>
            <span className={`text-xs mt-2 font-semibold tracking-wider font-mono ${activeNotes[0] ? 'text-zinc-950' : 'text-slate-300'}`}>
              {notes[0].label.replace(' (Ding)', '')}
            </span>
          </motion.button>
        )}

        {/* Outer Circular Notes (Pads 1-8) */}
        {notes.slice(1).map((note) => {
          const pos = getAngle(note.id);
          const isActive = activeNotes[note.id];
          return (
            <div
              key={note.id}
              style={{
                position: 'absolute',
                transform: `translate(${pos.x}px, ${pos.y}px)`
              }}
              className="z-10"
            >
              <motion.button
                id={`note-pad-${note.id}`}
                whileTap={{ scale: 0.94 }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleTrigger(note.id);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleTrigger(note.id);
                }}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-100 select-none shadow-lg group
                  ${isActive
                    ? 'bg-emerald-400 shadow-emerald-500/50 ring-4 ring-emerald-300 text-zinc-950'
                    : 'bg-gradient-to-br from-zinc-800/90 to-slate-900 border border-slate-700/50 hover:border-slate-500 text-slate-300'
                  }`}
              >
                {/* Dimple / Guiding circle */}
                <div className={`w-8 h-8 rounded-full mb-1 transition-all flex items-center justify-center
                  ${isActive ? 'bg-emerald-300' : 'bg-zinc-900/60 border border-zinc-700'}`}
                >
                  <span className={`text-[9px] font-mono ${isActive ? 'text-zinc-950 font-bold' : 'text-slate-500'}`}>{note.id}</span>
                </div>
                <span className="text-sm font-bold font-mono tracking-tight">{note.label}</span>
              </motion.button>
            </div>
          );
        })}
      </div>
    );
  };

  // Render Steel Tongue Drum with protruding steel tongues
  const renderTongueDrum = () => {
    return (
      <div className="relative w-full aspect-square max-w-[480px] mx-auto rounded-full bg-radial from-indigo-900 via-neutral-900 to-black p-3 shadow-2xl border border-indigo-900/40 flex items-center justify-center">
        {/* Steel protective ring */}
        <div className="absolute inset-3 rounded-full border border-zinc-800 pointer-events-none" />

        {/* Central visual hub */}
        <div className="absolute w-28 h-28 rounded-full bg-indigo-950/25 border border-indigo-500/10 pointer-events-none blur-md" />

        {/* Render tongues as physical U-shaped petals arranged in a circle */}
        {notes.map((note) => {
          const isDing = note.id === 0;
          const pos = getAngle(note.id);
          const isActive = activeNotes[note.id];

          // Rotate tongues to point outwards from center
          const angleDeg = isDing ? 0 : ((note.id - 1) * 360) / 8;

          return (
            <div
              key={note.id}
              style={{
                position: 'absolute',
                transform: isDing
                  ? 'translate(0, 0)'
                  : `translate(${pos.x}px, ${pos.y}px) rotate(${angleDeg}deg)`
              }}
              className={isDing ? 'z-20' : 'z-10'}
            >
              <motion.button
                id={`note-pad-${note.id}`}
                whileTap={{ scale: 0.93 }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleTrigger(note.id);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleTrigger(note.id);
                }}
                className={`cursor-pointer transition-all duration-100 select-none flex items-center justify-center shadow-lg
                  ${isDing
                    ? `w-28 h-28 rounded-full ${isActive ? 'bg-indigo-400 ring-4 ring-indigo-300 shadow-indigo-500/50' : 'bg-gradient-to-br from-indigo-950 to-zinc-950 border border-indigo-700/40'}`
                    : `w-16 h-28 rounded-t-3xl rounded-b-lg ${isActive ? 'bg-indigo-400 ring-4 ring-indigo-300 shadow-indigo-500/50' : 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-indigo-900/20 hover:border-indigo-700/35'}`
                  }`}
              >
                <div
                  style={{ transform: isDing ? 'none' : `rotate(${-angleDeg}deg)` }}
                  className="flex flex-col items-center justify-center pointer-events-none"
                >
                  <span className={`text-[9px] font-mono uppercase tracking-widest ${isActive ? 'text-zinc-950 font-bold' : 'text-indigo-400/75'}`}>
                    {isDing ? 'Bass' : `T${note.id}`}
                  </span>
                  <span className={`text-base font-bold font-mono ${isActive ? 'text-zinc-950' : 'text-slate-100'}`}>
                    {note.label.replace(' (Ding)', '')}
                  </span>
                </div>
              </motion.button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative py-8 select-none">
      <div className="flex flex-col items-center">
        {drumType === 'handpan' ? renderHandpan() : renderTongueDrum()}

        {/* Hotkey guides */}
        <div className="mt-6 flex items-center gap-2 bg-zinc-900/65 border border-zinc-800/80 px-4 py-2 rounded-full text-xs text-slate-400 font-mono">
          <span className="text-amber-500">Keyboard Mode:</span>
          <div className="flex gap-1.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
              <kbd key={key} className="bg-zinc-800 text-slate-200 px-1.5 py-0.5 rounded border border-zinc-700">
                {key}
              </kbd>
            ))}
          </div>
          <span className="text-slate-500 ml-1">(Ding is 1)</span>
        </div>
      </div>
    </div>
  );
}
