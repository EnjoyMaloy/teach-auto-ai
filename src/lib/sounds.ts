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

export type SoundTheme = 'duolingo' | 'minimal' | 'playful' | 'none';

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
  { value: 'duolingo', label: 'Duolingo', description: 'Классические звуки как в Duolingo' },
  { value: 'minimal', label: 'Минимальные', description: 'Тихие и ненавязчивые' },
  { value: 'playful', label: 'Игривые', description: 'Весёлые и энергичные' },
  { value: 'none', label: 'Без звука', description: 'Полностью отключить звуки' },
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
