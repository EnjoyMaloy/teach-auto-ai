// Sound effects system for course player
// Uses Web Audio API to generate Duolingo-style sounds

export type SoundType = 
  | 'tap'           // Light tap for navigation
  | 'swipe'         // Swipe/transition between slides
  | 'correct'       // Correct answer
  | 'incorrect'     // Wrong answer
  | 'complete'      // Lesson/course complete
  | 'levelUp'       // Achievement unlocked
  | 'pop';          // Generic pop sound

export type SoundTheme = 
  | 'duolingo' 
  | 'minimal' 
  | 'playful' 
  | 'retro' 
  | 'nature' 
  | 'synth' 
  | 'arcade' 
  | 'soft' 
  | 'bright' 
  | 'deep' 
  | 'chime' 
  | 'bubble' 
  | 'marimba' 
  | 'bell' 
  | 'piano' 
  | 'guitar' 
  | 'whistle' 
  | 'cosmic' 
  | 'jazz' 
  | 'electronic' 
  | 'wooden' 
  | 'crystal' 
  | 'wind' 
  | 'none';

export interface SoundConfig {
  enabled: boolean;
  theme: SoundTheme;
  volume: number; // 0 to 1
}

export interface SoundSettings {
  enabled: boolean;
  theme: SoundTheme;
  volume: number;
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  theme: 'duolingo',
  volume: 0.5,
};

export const SOUND_THEME_OPTIONS = [
  { value: 'duolingo', label: 'Duolingo' },
  { value: 'minimal', label: 'Минимальные' },
  { value: 'playful', label: 'Игривые' },
  { value: 'retro', label: 'Ретро' },
  { value: 'nature', label: 'Природа' },
  { value: 'synth', label: 'Синтезатор' },
  { value: 'arcade', label: 'Аркада' },
  { value: 'soft', label: 'Мягкие' },
  { value: 'bright', label: 'Яркие' },
  { value: 'deep', label: 'Глубокие' },
  { value: 'chime', label: 'Колокольчики' },
  { value: 'bubble', label: 'Пузыри' },
  { value: 'marimba', label: 'Маримба' },
  { value: 'bell', label: 'Колокол' },
  { value: 'piano', label: 'Пианино' },
  { value: 'guitar', label: 'Гитара' },
  { value: 'whistle', label: 'Свист' },
  { value: 'cosmic', label: 'Космос' },
  { value: 'jazz', label: 'Джаз' },
  { value: 'electronic', label: 'Электро' },
  { value: 'wooden', label: 'Деревянные' },
  { value: 'crystal', label: 'Кристалл' },
  { value: 'wind', label: 'Ветер' },
  { value: 'none', label: 'Без звука' },
] as const;

// Audio context singleton
let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Auto-resume if suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Simple oscillator helper
function playTone(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  delay: number = 0,
  frequencyEnd?: number
) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.connect(gain);
  gain.connect(ctx.destination);

  const startTime = ctx.currentTime + delay;
  
  osc.frequency.setValueAtTime(frequency, startTime);
  if (frequencyEnd) {
    osc.frequency.exponentialRampToValueAtTime(frequencyEnd, startTime + duration);
  }

  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

// Sound definitions by theme
const sounds: Record<SoundTheme, Record<SoundType, (vol: number) => void>> = {
  duolingo: {
    tap: (vol) => playTone(800, 0.08, 0.3 * vol, 'sine', 0, 600),
    swipe: (vol) => playTone(400, 0.15, 0.2 * vol, 'sine', 0, 600),
    correct: (vol) => {
      playTone(523, 0.2, 0.3 * vol, 'sine', 0);
      playTone(659, 0.2, 0.3 * vol, 'sine', 0.08);
      playTone(784, 0.2, 0.3 * vol, 'sine', 0.16);
    },
    incorrect: (vol) => {
      playTone(350, 0.15, 0.15 * vol, 'sawtooth', 0);
      playTone(300, 0.15, 0.15 * vol, 'sawtooth', 0.1);
    },
    complete: (vol) => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        playTone(freq, 0.5, 0.25 * vol, 'sine', i * 0.05);
      });
    },
    levelUp: (vol) => {
      [440, 554, 659, 880, 1109, 1319].forEach((freq, i) => {
        playTone(freq, 0.3, 0.2 * vol, 'triangle', i * 0.06);
      });
    },
    pop: (vol) => playTone(600, 0.1, 0.4 * vol, 'sine', 0, 200),
  },

  minimal: {
    tap: (vol) => playTone(1000, 0.03, 0.1 * vol),
    swipe: (vol) => playTone(500, 0.08, 0.1 * vol, 'sine', 0, 700),
    correct: (vol) => playTone(600, 0.15, 0.15 * vol, 'sine', 0, 800),
    incorrect: (vol) => playTone(300, 0.15, 0.15 * vol),
    complete: (vol) => playTone(600, 0.15, 0.15 * vol, 'sine', 0, 800),
    levelUp: (vol) => playTone(600, 0.15, 0.15 * vol, 'sine', 0, 800),
    pop: (vol) => playTone(1000, 0.03, 0.1 * vol),
  },

  playful: {
    tap: (vol) => playTone(1200, 0.05, 0.1 * vol, 'square', 0, 800),
    swipe: (vol) => {
      [400, 500, 600].forEach((freq, i) => {
        playTone(freq, 0.08, 0.15 * vol, 'triangle', i * 0.03);
      });
    },
    correct: (vol) => {
      [523, 784, 1047].forEach((freq, i) => {
        playTone(freq, 0.15, 0.25 * vol, 'triangle', i * 0.06);
      });
    },
    incorrect: (vol) => playTone(200, 0.2, 0.1 * vol, 'square', 0, 100),
    complete: (vol) => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        playTone(freq, 0.5, 0.25 * vol, 'sine', i * 0.05);
      });
    },
    levelUp: (vol) => {
      [440, 554, 659, 880, 1109, 1319].forEach((freq, i) => {
        playTone(freq, 0.3, 0.2 * vol, 'triangle', i * 0.06);
      });
    },
    pop: (vol) => playTone(600, 0.1, 0.4 * vol, 'sine', 0, 200),
  },

  retro: {
    tap: (vol) => playTone(440, 0.05, 0.2 * vol, 'square'),
    swipe: (vol) => playTone(220, 0.1, 0.15 * vol, 'square', 0, 440),
    correct: (vol) => {
      playTone(440, 0.1, 0.2 * vol, 'square', 0);
      playTone(880, 0.1, 0.2 * vol, 'square', 0.1);
    },
    incorrect: (vol) => playTone(110, 0.2, 0.15 * vol, 'square'),
    complete: (vol) => {
      [262, 330, 392, 523].forEach((freq, i) => {
        playTone(freq, 0.15, 0.2 * vol, 'square', i * 0.1);
      });
    },
    levelUp: (vol) => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        playTone(freq, 0.1, 0.2 * vol, 'square', i * 0.08);
      });
    },
    pop: (vol) => playTone(880, 0.05, 0.25 * vol, 'square'),
  },

  nature: {
    tap: (vol) => playTone(1200, 0.08, 0.15 * vol, 'sine', 0, 800),
    swipe: (vol) => playTone(300, 0.2, 0.1 * vol, 'sine', 0, 600),
    correct: (vol) => {
      [880, 1100, 1320].forEach((freq, i) => {
        playTone(freq, 0.15, 0.15 * vol, 'sine', i * 0.05);
      });
    },
    incorrect: (vol) => playTone(200, 0.3, 0.1 * vol, 'sine', 0, 150),
    complete: (vol) => {
      [440, 550, 660, 880].forEach((freq, i) => {
        playTone(freq, 0.4, 0.15 * vol, 'sine', i * 0.08);
      });
    },
    levelUp: (vol) => {
      [523, 659, 784, 1047, 1319].forEach((freq, i) => {
        playTone(freq, 0.25, 0.12 * vol, 'sine', i * 0.07);
      });
    },
    pop: (vol) => playTone(1000, 0.06, 0.2 * vol, 'sine', 0, 500),
  },

  synth: {
    tap: (vol) => playTone(600, 0.06, 0.2 * vol, 'sawtooth', 0, 400),
    swipe: (vol) => playTone(200, 0.15, 0.15 * vol, 'sawtooth', 0, 400),
    correct: (vol) => {
      playTone(400, 0.15, 0.2 * vol, 'sawtooth', 0);
      playTone(600, 0.15, 0.2 * vol, 'sawtooth', 0.1);
    },
    incorrect: (vol) => playTone(150, 0.2, 0.15 * vol, 'sawtooth'),
    complete: (vol) => {
      [200, 300, 400, 600].forEach((freq, i) => {
        playTone(freq, 0.3, 0.15 * vol, 'sawtooth', i * 0.08);
      });
    },
    levelUp: (vol) => {
      [300, 450, 600, 900].forEach((freq, i) => {
        playTone(freq, 0.2, 0.15 * vol, 'sawtooth', i * 0.06);
      });
    },
    pop: (vol) => playTone(500, 0.08, 0.25 * vol, 'sawtooth', 0, 250),
  },

  arcade: {
    tap: (vol) => playTone(1000, 0.04, 0.25 * vol, 'square'),
    swipe: (vol) => playTone(300, 0.1, 0.2 * vol, 'square', 0, 600),
    correct: (vol) => {
      playTone(523, 0.08, 0.25 * vol, 'square', 0);
      playTone(784, 0.08, 0.25 * vol, 'square', 0.08);
      playTone(1047, 0.1, 0.25 * vol, 'square', 0.16);
    },
    incorrect: (vol) => {
      playTone(200, 0.1, 0.2 * vol, 'square', 0);
      playTone(150, 0.15, 0.2 * vol, 'square', 0.1);
    },
    complete: (vol) => {
      [523, 659, 784, 1047, 1319].forEach((freq, i) => {
        playTone(freq, 0.12, 0.2 * vol, 'square', i * 0.06);
      });
    },
    levelUp: (vol) => {
      [262, 330, 392, 523, 659, 784].forEach((freq, i) => {
        playTone(freq, 0.1, 0.2 * vol, 'square', i * 0.05);
      });
    },
    pop: (vol) => playTone(1200, 0.05, 0.3 * vol, 'square'),
  },

  soft: {
    tap: (vol) => playTone(600, 0.1, 0.1 * vol, 'sine'),
    swipe: (vol) => playTone(300, 0.2, 0.08 * vol, 'sine', 0, 400),
    correct: (vol) => playTone(500, 0.25, 0.12 * vol, 'sine', 0, 700),
    incorrect: (vol) => playTone(250, 0.2, 0.08 * vol, 'sine'),
    complete: (vol) => {
      [400, 500, 600].forEach((freq, i) => {
        playTone(freq, 0.4, 0.1 * vol, 'sine', i * 0.1);
      });
    },
    levelUp: (vol) => {
      [350, 440, 550, 700].forEach((freq, i) => {
        playTone(freq, 0.3, 0.1 * vol, 'sine', i * 0.08);
      });
    },
    pop: (vol) => playTone(500, 0.12, 0.15 * vol, 'sine', 0, 300),
  },

  bright: {
    tap: (vol) => playTone(1400, 0.04, 0.25 * vol, 'sine'),
    swipe: (vol) => playTone(800, 0.1, 0.2 * vol, 'sine', 0, 1200),
    correct: (vol) => {
      [1047, 1319, 1568].forEach((freq, i) => {
        playTone(freq, 0.12, 0.25 * vol, 'sine', i * 0.05);
      });
    },
    incorrect: (vol) => playTone(400, 0.15, 0.15 * vol, 'sine', 0, 300),
    complete: (vol) => {
      [1047, 1319, 1568, 2093].forEach((freq, i) => {
        playTone(freq, 0.3, 0.2 * vol, 'sine', i * 0.06);
      });
    },
    levelUp: (vol) => {
      [880, 1100, 1320, 1760].forEach((freq, i) => {
        playTone(freq, 0.2, 0.2 * vol, 'sine', i * 0.05);
      });
    },
    pop: (vol) => playTone(1600, 0.05, 0.3 * vol, 'sine', 0, 1000),
  },

  deep: {
    tap: (vol) => playTone(200, 0.1, 0.2 * vol, 'sine'),
    swipe: (vol) => playTone(100, 0.2, 0.15 * vol, 'sine', 0, 200),
    correct: (vol) => {
      [220, 330, 440].forEach((freq, i) => {
        playTone(freq, 0.2, 0.2 * vol, 'sine', i * 0.08);
      });
    },
    incorrect: (vol) => playTone(80, 0.25, 0.15 * vol, 'sine'),
    complete: (vol) => {
      [110, 165, 220, 330].forEach((freq, i) => {
        playTone(freq, 0.4, 0.18 * vol, 'sine', i * 0.1);
      });
    },
    levelUp: (vol) => {
      [165, 220, 330, 440].forEach((freq, i) => {
        playTone(freq, 0.3, 0.15 * vol, 'sine', i * 0.08);
      });
    },
    pop: (vol) => playTone(150, 0.12, 0.25 * vol, 'sine', 0, 100),
  },

  chime: {
    tap: (vol) => playTone(2000, 0.15, 0.15 * vol, 'sine'),
    swipe: (vol) => playTone(1500, 0.2, 0.12 * vol, 'sine', 0, 2000),
    correct: (vol) => {
      [1568, 1976, 2349].forEach((freq, i) => {
        playTone(freq, 0.25, 0.15 * vol, 'sine', i * 0.08);
      });
    },
    incorrect: (vol) => playTone(800, 0.2, 0.1 * vol, 'sine'),
    complete: (vol) => {
      [1319, 1568, 1976, 2637].forEach((freq, i) => {
        playTone(freq, 0.4, 0.12 * vol, 'sine', i * 0.1);
      });
    },
    levelUp: (vol) => {
      [1047, 1319, 1568, 2093, 2637].forEach((freq, i) => {
        playTone(freq, 0.3, 0.12 * vol, 'sine', i * 0.07);
      });
    },
    pop: (vol) => playTone(2400, 0.1, 0.2 * vol, 'sine', 0, 1800),
  },

  bubble: {
    tap: (vol) => playTone(800, 0.08, 0.2 * vol, 'sine', 0, 1200),
    swipe: (vol) => playTone(400, 0.15, 0.15 * vol, 'sine', 0, 800),
    correct: (vol) => {
      [600, 900, 1200].forEach((freq, i) => {
        playTone(freq, 0.1, 0.2 * vol, 'sine', i * 0.05, freq * 1.5);
      });
    },
    incorrect: (vol) => playTone(500, 0.15, 0.12 * vol, 'sine', 0, 300),
    complete: (vol) => {
      [500, 700, 900, 1200].forEach((freq, i) => {
        playTone(freq, 0.2, 0.15 * vol, 'sine', i * 0.08, freq * 1.3);
      });
    },
    levelUp: (vol) => {
      [400, 600, 800, 1000, 1300].forEach((freq, i) => {
        playTone(freq, 0.15, 0.15 * vol, 'sine', i * 0.06, freq * 1.4);
      });
    },
    pop: (vol) => playTone(700, 0.1, 0.25 * vol, 'sine', 0, 1100),
  },

  marimba: {
    tap: (vol) => playTone(700, 0.12, 0.25 * vol, 'triangle'),
    swipe: (vol) => playTone(350, 0.15, 0.2 * vol, 'triangle', 0, 500),
    correct: (vol) => {
      [523, 659, 784].forEach((freq, i) => {
        playTone(freq, 0.15, 0.25 * vol, 'triangle', i * 0.06);
      });
    },
    incorrect: (vol) => playTone(262, 0.2, 0.18 * vol, 'triangle'),
    complete: (vol) => {
      [392, 523, 659, 784].forEach((freq, i) => {
        playTone(freq, 0.25, 0.2 * vol, 'triangle', i * 0.08);
      });
    },
    levelUp: (vol) => {
      [330, 440, 550, 660, 880].forEach((freq, i) => {
        playTone(freq, 0.18, 0.2 * vol, 'triangle', i * 0.06);
      });
    },
    pop: (vol) => playTone(880, 0.1, 0.28 * vol, 'triangle'),
  },

  bell: {
    tap: (vol) => playTone(1200, 0.2, 0.15 * vol, 'sine'),
    swipe: (vol) => playTone(800, 0.25, 0.12 * vol, 'sine', 0, 1000),
    correct: (vol) => {
      playTone(1047, 0.3, 0.18 * vol, 'sine', 0);
      playTone(1319, 0.3, 0.15 * vol, 'sine', 0.1);
    },
    incorrect: (vol) => playTone(400, 0.3, 0.12 * vol, 'sine'),
    complete: (vol) => {
      [784, 988, 1175, 1568].forEach((freq, i) => {
        playTone(freq, 0.5, 0.15 * vol, 'sine', i * 0.12);
      });
    },
    levelUp: (vol) => {
      [659, 784, 988, 1319].forEach((freq, i) => {
        playTone(freq, 0.4, 0.15 * vol, 'sine', i * 0.1);
      });
    },
    pop: (vol) => playTone(1400, 0.15, 0.2 * vol, 'sine'),
  },

  piano: {
    tap: (vol) => playTone(523, 0.12, 0.22 * vol, 'triangle'),
    swipe: (vol) => playTone(392, 0.15, 0.18 * vol, 'triangle', 0, 523),
    correct: (vol) => {
      [523, 659, 784].forEach((freq, i) => {
        playTone(freq, 0.2, 0.22 * vol, 'triangle', i * 0.05);
      });
    },
    incorrect: (vol) => {
      playTone(311, 0.15, 0.15 * vol, 'triangle', 0);
      playTone(277, 0.2, 0.15 * vol, 'triangle', 0.1);
    },
    complete: (vol) => {
      [523, 659, 784, 1047].forEach((freq, i) => {
        playTone(freq, 0.35, 0.2 * vol, 'triangle', i * 0.08);
      });
    },
    levelUp: (vol) => {
      [440, 523, 659, 784, 1047].forEach((freq, i) => {
        playTone(freq, 0.25, 0.18 * vol, 'triangle', i * 0.06);
      });
    },
    pop: (vol) => playTone(659, 0.1, 0.25 * vol, 'triangle'),
  },

  guitar: {
    tap: (vol) => playTone(330, 0.15, 0.2 * vol, 'sawtooth'),
    swipe: (vol) => playTone(220, 0.2, 0.15 * vol, 'sawtooth', 0, 330),
    correct: (vol) => {
      [330, 440, 550].forEach((freq, i) => {
        playTone(freq, 0.2, 0.2 * vol, 'sawtooth', i * 0.06);
      });
    },
    incorrect: (vol) => playTone(165, 0.25, 0.15 * vol, 'sawtooth'),
    complete: (vol) => {
      [220, 330, 440, 550].forEach((freq, i) => {
        playTone(freq, 0.35, 0.18 * vol, 'sawtooth', i * 0.1);
      });
    },
    levelUp: (vol) => {
      [196, 247, 330, 392, 494].forEach((freq, i) => {
        playTone(freq, 0.25, 0.15 * vol, 'sawtooth', i * 0.07);
      });
    },
    pop: (vol) => playTone(440, 0.12, 0.22 * vol, 'sawtooth'),
  },

  whistle: {
    tap: (vol) => playTone(1800, 0.06, 0.15 * vol, 'sine', 0, 2200),
    swipe: (vol) => playTone(1200, 0.12, 0.12 * vol, 'sine', 0, 1600),
    correct: (vol) => {
      playTone(1400, 0.1, 0.15 * vol, 'sine', 0, 1800);
      playTone(1800, 0.1, 0.15 * vol, 'sine', 0.08, 2200);
    },
    incorrect: (vol) => playTone(1000, 0.15, 0.1 * vol, 'sine', 0, 800),
    complete: (vol) => {
      [1400, 1600, 1800, 2200].forEach((freq, i) => {
        playTone(freq, 0.15, 0.12 * vol, 'sine', i * 0.08, freq * 1.2);
      });
    },
    levelUp: (vol) => {
      [1200, 1500, 1800, 2100, 2400].forEach((freq, i) => {
        playTone(freq, 0.12, 0.12 * vol, 'sine', i * 0.06, freq * 1.15);
      });
    },
    pop: (vol) => playTone(2000, 0.08, 0.18 * vol, 'sine', 0, 2500),
  },

  cosmic: {
    tap: (vol) => playTone(600, 0.1, 0.15 * vol, 'sine', 0, 1200),
    swipe: (vol) => playTone(200, 0.25, 0.12 * vol, 'sine', 0, 600),
    correct: (vol) => {
      [400, 800, 1200].forEach((freq, i) => {
        playTone(freq, 0.2, 0.15 * vol, 'sine', i * 0.08, freq * 1.5);
      });
    },
    incorrect: (vol) => playTone(300, 0.25, 0.1 * vol, 'sine', 0, 150),
    complete: (vol) => {
      [300, 500, 800, 1200].forEach((freq, i) => {
        playTone(freq, 0.4, 0.12 * vol, 'sine', i * 0.12, freq * 1.3);
      });
    },
    levelUp: (vol) => {
      [250, 400, 650, 1000, 1500].forEach((freq, i) => {
        playTone(freq, 0.3, 0.12 * vol, 'sine', i * 0.1, freq * 1.4);
      });
    },
    pop: (vol) => playTone(500, 0.12, 0.18 * vol, 'sine', 0, 1000),
  },

  jazz: {
    tap: (vol) => playTone(440, 0.1, 0.2 * vol, 'triangle'),
    swipe: (vol) => playTone(330, 0.15, 0.15 * vol, 'triangle', 0, 440),
    correct: (vol) => {
      [440, 554, 659].forEach((freq, i) => {
        playTone(freq, 0.18, 0.2 * vol, 'triangle', i * 0.07);
      });
    },
    incorrect: (vol) => {
      playTone(311, 0.12, 0.15 * vol, 'triangle', 0);
      playTone(370, 0.15, 0.12 * vol, 'triangle', 0.08);
    },
    complete: (vol) => {
      [349, 440, 523, 659].forEach((freq, i) => {
        playTone(freq, 0.3, 0.18 * vol, 'triangle', i * 0.1);
      });
    },
    levelUp: (vol) => {
      [330, 415, 494, 622, 740].forEach((freq, i) => {
        playTone(freq, 0.22, 0.15 * vol, 'triangle', i * 0.08);
      });
    },
    pop: (vol) => playTone(554, 0.1, 0.22 * vol, 'triangle'),
  },

  electronic: {
    tap: (vol) => playTone(800, 0.04, 0.25 * vol, 'square', 0, 1200),
    swipe: (vol) => playTone(300, 0.1, 0.2 * vol, 'square', 0, 800),
    correct: (vol) => {
      [600, 900, 1200].forEach((freq, i) => {
        playTone(freq, 0.08, 0.22 * vol, 'square', i * 0.04);
      });
    },
    incorrect: (vol) => playTone(200, 0.15, 0.18 * vol, 'square', 0, 100),
    complete: (vol) => {
      [400, 600, 800, 1200].forEach((freq, i) => {
        playTone(freq, 0.15, 0.2 * vol, 'square', i * 0.05);
      });
    },
    levelUp: (vol) => {
      [300, 500, 700, 1000, 1400].forEach((freq, i) => {
        playTone(freq, 0.1, 0.2 * vol, 'square', i * 0.04);
      });
    },
    pop: (vol) => playTone(1000, 0.05, 0.28 * vol, 'square', 0, 600),
  },

  wooden: {
    tap: (vol) => playTone(300, 0.08, 0.25 * vol, 'triangle'),
    swipe: (vol) => playTone(200, 0.12, 0.2 * vol, 'triangle', 0, 300),
    correct: (vol) => {
      [300, 400, 500].forEach((freq, i) => {
        playTone(freq, 0.1, 0.25 * vol, 'triangle', i * 0.04);
      });
    },
    incorrect: (vol) => playTone(150, 0.15, 0.2 * vol, 'triangle'),
    complete: (vol) => {
      [250, 350, 450, 550].forEach((freq, i) => {
        playTone(freq, 0.2, 0.22 * vol, 'triangle', i * 0.06);
      });
    },
    levelUp: (vol) => {
      [200, 280, 360, 450, 560].forEach((freq, i) => {
        playTone(freq, 0.15, 0.2 * vol, 'triangle', i * 0.05);
      });
    },
    pop: (vol) => playTone(400, 0.08, 0.28 * vol, 'triangle'),
  },

  crystal: {
    tap: (vol) => playTone(2400, 0.12, 0.12 * vol, 'sine'),
    swipe: (vol) => playTone(1600, 0.18, 0.1 * vol, 'sine', 0, 2400),
    correct: (vol) => {
      [2000, 2400, 2800].forEach((freq, i) => {
        playTone(freq, 0.2, 0.12 * vol, 'sine', i * 0.06);
      });
    },
    incorrect: (vol) => playTone(1200, 0.2, 0.08 * vol, 'sine', 0, 800),
    complete: (vol) => {
      [1600, 2000, 2400, 3000].forEach((freq, i) => {
        playTone(freq, 0.35, 0.1 * vol, 'sine', i * 0.1);
      });
    },
    levelUp: (vol) => {
      [1400, 1800, 2200, 2800, 3400].forEach((freq, i) => {
        playTone(freq, 0.25, 0.1 * vol, 'sine', i * 0.08);
      });
    },
    pop: (vol) => playTone(2800, 0.1, 0.15 * vol, 'sine', 0, 2000),
  },

  wind: {
    tap: (vol) => playTone(600, 0.15, 0.1 * vol, 'sine', 0, 900),
    swipe: (vol) => playTone(300, 0.3, 0.08 * vol, 'sine', 0, 600),
    correct: (vol) => {
      [500, 700, 900].forEach((freq, i) => {
        playTone(freq, 0.25, 0.1 * vol, 'sine', i * 0.1, freq * 1.2);
      });
    },
    incorrect: (vol) => playTone(350, 0.3, 0.08 * vol, 'sine', 0, 250),
    complete: (vol) => {
      [400, 550, 700, 900].forEach((freq, i) => {
        playTone(freq, 0.45, 0.08 * vol, 'sine', i * 0.15, freq * 1.15);
      });
    },
    levelUp: (vol) => {
      [350, 500, 650, 850, 1100].forEach((freq, i) => {
        playTone(freq, 0.35, 0.08 * vol, 'sine', i * 0.12, freq * 1.2);
      });
    },
    pop: (vol) => playTone(700, 0.15, 0.12 * vol, 'sine', 0, 1000),
  },

  none: {
    tap: () => {},
    swipe: () => {},
    correct: () => {},
    incorrect: () => {},
    complete: () => {},
    levelUp: () => {},
    pop: () => {},
  },
};

// Main function to play sounds
export function playSound(type: SoundType, config?: Partial<SoundConfig>) {
  const enabled = config?.enabled ?? true;
  const theme = config?.theme ?? 'duolingo';
  const volume = config?.volume ?? 0.5;

  if (!enabled || theme === 'none') return;

  try {
    sounds[theme]?.[type]?.(volume);
  } catch (e) {
    // Silently fail if audio not supported
  }
}

// Pre-warm audio context (call on user interaction)
export function initAudioContext() {
  try {
    getContext();
  } catch {
    // Audio not supported
  }
}
