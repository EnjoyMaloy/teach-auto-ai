// Design System configuration for courses

export type SoundTheme = 'duolingo' | 'minimal' | 'playful' | 'none';

export interface SoundSettings {
  enabled: boolean;
  theme: SoundTheme;
  volume: number;
}

export type ButtonDepth = 'flat' | 'raised';

// Design block backdrop options
export interface DesignBlockSettings {
  // Text sub-block backdrop colors (HSL values)
  backdropLightColor?: string;
  backdropDarkColor?: string;
  backdropPrimaryColor?: string;
  backdropBlurColor?: string;
  
  // Text highlighting colors
  highlightMarkerColor?: string;
  highlightUnderlineColor?: string;
  highlightWavyColor?: string;
}

// Mascot settings for AI-generated characters
export interface MascotSettings {
  // AI prompt describing the mascot character
  prompt?: string;
  // Style notes (e.g., "flat vector", "3D cartoon", "pixel art")
  style?: string;
  // Approved mascot image URL
  approvedImageUrl?: string;
  // Whether the mascot is approved and locked
  isApproved?: boolean;
  // Character name
  name?: string;
  // Character personality traits for AI context
  personality?: string;
}

export const DEFAULT_MASCOT_SETTINGS: MascotSettings = {
  prompt: '',
  style: 'flat vector illustration',
  approvedImageUrl: '',
  isApproved: false,
  name: '',
  personality: '',
};

export const DEFAULT_DESIGN_BLOCK_SETTINGS: Required<DesignBlockSettings> = {
  backdropLightColor: '0 0% 0% / 0.05',
  backdropDarkColor: '0 0% 0% / 0.9',
  backdropPrimaryColor: '262 83% 58% / 0.1',
  backdropBlurColor: '0 0% 0% / 0.03',
  highlightMarkerColor: '50 100% 50% / 0.4',
  highlightUnderlineColor: '262 83% 58%',
  highlightWavyColor: '0 84% 60%',
};

export interface DesignSystemConfig {
  // Colors (HSL values as strings, e.g., "262 83% 58%")
  primaryColor: string;
  primaryForeground: string;
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  mutedColor: string;
  accentColor: string;
  successColor: string;
  destructiveColor: string;
  
  // Typography
  fontFamily: string;
  headingFontFamily: string;
  
  // Border radius
  borderRadius: string; // e.g., "0.5rem", "1rem", "1.5rem"
  
  // Button style
  buttonStyle: 'rounded' | 'pill' | 'square';
  
  // Button depth (flat or 3D raised)
  buttonDepth?: ButtonDepth;
  
  // Sound settings
  sound?: SoundSettings;
  
  // Design block settings
  designBlock?: DesignBlockSettings;
  
  // Mascot settings
  mascot?: MascotSettings;
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  theme: 'duolingo',
  volume: 0.5,
};

export const DEFAULT_DESIGN_SYSTEM: DesignSystemConfig = {
  primaryColor: '262 83% 58%',
  primaryForeground: '0 0% 100%',
  backgroundColor: '0 0% 100%',
  foregroundColor: '240 10% 4%',
  cardColor: '0 0% 100%',
  mutedColor: '240 5% 96%',
  accentColor: '240 5% 96%',
  successColor: '142 71% 45%',
  destructiveColor: '0 84% 60%',
  fontFamily: 'Inter, system-ui, sans-serif',
  headingFontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: '0.75rem',
  buttonStyle: 'rounded',
  buttonDepth: 'raised',
  sound: DEFAULT_SOUND_SETTINGS,
};

export interface ThemePreset {
  id: string;
  name: string;
  config: Partial<DesignSystemConfig>;
  isCustom?: boolean;
}

// Base themes that cannot be deleted
export const BASE_THEMES: ThemePreset[] = [
  {
    id: 'duolingo',
    name: 'Duolingo',
    config: {
      primaryColor: '142 71% 45%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '0 0% 100%',
      foregroundColor: '0 0% 20%',
      cardColor: '0 0% 100%',
      mutedColor: '240 5% 96%',
      successColor: '142 71% 45%',
      destructiveColor: '0 84% 60%',
      borderRadius: '1rem',
      buttonStyle: 'rounded',
      buttonDepth: 'raised',
    },
    isCustom: false,
  },
  {
    id: 'notion',
    name: 'Notion',
    config: {
      primaryColor: '0 0% 9%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '0 0% 100%',
      foregroundColor: '0 0% 9%',
      cardColor: '0 0% 100%',
      mutedColor: '0 0% 96%',
      successColor: '142 71% 45%',
      destructiveColor: '0 84% 60%',
      borderRadius: '0.375rem',
      buttonStyle: 'rounded',
      buttonDepth: 'flat',
    },
    isCustom: false,
  },
  {
    id: 'ocean',
    name: 'Океан',
    config: {
      primaryColor: '199 89% 48%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '200 20% 98%',
      foregroundColor: '200 50% 10%',
      cardColor: '0 0% 100%',
      mutedColor: '200 20% 92%',
      accentColor: '199 89% 90%',
      successColor: '160 60% 45%',
      destructiveColor: '0 84% 60%',
      borderRadius: '1rem',
      buttonStyle: 'pill',
      buttonDepth: 'raised',
    },
    isCustom: false,
  },
  {
    id: 'forest',
    name: 'Лес',
    config: {
      primaryColor: '160 60% 35%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '120 10% 98%',
      foregroundColor: '160 40% 10%',
      cardColor: '120 10% 100%',
      mutedColor: '120 10% 92%',
      accentColor: '160 60% 90%',
      successColor: '160 60% 35%',
      destructiveColor: '0 70% 50%',
      borderRadius: '0.5rem',
      buttonStyle: 'rounded',
      buttonDepth: 'raised',
    },
    isCustom: false,
  },
];

// For backward compatibility
export const PRESET_THEMES = BASE_THEMES;

export const FONT_OPTIONS = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: '"SF Pro Display", system-ui, sans-serif', label: 'SF Pro' },
  { value: '"Nunito", sans-serif', label: 'Nunito' },
  { value: '"Poppins", sans-serif', label: 'Poppins' },
  { value: '"Roboto", sans-serif', label: 'Roboto' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: '"Montserrat", sans-serif', label: 'Montserrat' },
  { value: '"Raleway", sans-serif', label: 'Raleway' },
  { value: '"Playfair Display", serif', label: 'Playfair Display' },
];

export const BORDER_RADIUS_OPTIONS = [
  { value: '0', label: 'Без скругления' },
  { value: '0.375rem', label: 'Маленький' },
  { value: '0.5rem', label: 'Средний' },
  { value: '0.75rem', label: 'Большой' },
  { value: '1rem', label: 'Очень большой' },
  { value: '1.5rem', label: 'Максимальный' },
];
