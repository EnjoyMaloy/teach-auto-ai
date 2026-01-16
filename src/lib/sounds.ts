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

interface SoundConfig {
  enabled: boolean;
  theme: SoundTheme;
  volume: number; // 0 to 1
}

const DEFAULT_SOUND_CONFIG: SoundConfig = {
  enabled: true,
  theme: 'duolingo',
  volume: 0.5,
};

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Sound generators for different themes
const soundGenerators: Record<SoundTheme, Record<SoundType, (volume: number) => void>> = {
  duolingo: {
    tap: (volume) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.3 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    },
    
    swipe: (volume) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.2 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    },
    
    correct: (volume) => {
      const ctx = getAudioContext();
      
      // Play ascending notes
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3 * volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    },
    
    incorrect: (volume) => {
      const ctx = getAudioContext();
      
      // Play descending dissonant notes
      [350, 300].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.15 * volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    },
    
    complete: (volume) => {
      const ctx = getAudioContext();
      
      // Triumphant chord
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.05;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25 * volume, startTime + 0.05);
        gain.gain.setValueAtTime(0.25 * volume, startTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);
        
        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    },
    
    levelUp: (volume) => {
      const ctx = getAudioContext();
      
      // Magical ascending arpeggio
      [440, 554.37, 659.25, 880, 1108.73, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.06;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2 * volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    },
    
    pop: (volume) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.4 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    },
  },
  
  minimal: {
    tap: (volume) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.1 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    },
    
    swipe: (volume) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.1 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    },
    
    correct: (volume) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.15 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    },
    
    incorrect: (volume) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 300;
      gain.gain.setValueAtTime(0.15 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    },
    
    complete: (volume) => soundGenerators.minimal.correct(volume),
    levelUp: (volume) => soundGenerators.minimal.correct(volume),
    pop: (volume) => soundGenerators.minimal.tap(volume),
  },
  
  playful: {
    tap: (volume) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.1 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    },
    
    swipe: (volume) => {
      const ctx = getAudioContext();
      
      [400, 500, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.03;
        gain.gain.setValueAtTime(0.15 * volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
        
        osc.start(startTime);
        osc.stop(startTime + 0.08);
      });
    },
    
    correct: (volume) => {
      const ctx = getAudioContext();
      
      [523.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        
        const startTime = ctx.currentTime + i * 0.06;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25 * volume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    },
    
    incorrect: (volume) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.1 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    },
    
    complete: (volume) => soundGenerators.duolingo.complete(volume),
    levelUp: (volume) => soundGenerators.duolingo.levelUp(volume),
    pop: (volume) => soundGenerators.duolingo.pop(volume),
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

// Main play sound function
export const playSound = (type: SoundType, config: Partial<SoundConfig> = {}) => {
  const finalConfig = { ...DEFAULT_SOUND_CONFIG, ...config };
  
  if (!finalConfig.enabled || finalConfig.theme === 'none') return;
  
  try {
    const generator = soundGenerators[finalConfig.theme]?.[type];
    if (generator) {
      generator(finalConfig.volume);
    }
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
};

// Sound settings for design system
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
