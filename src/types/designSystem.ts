// Design System configuration for courses

export type SoundTheme = 'duolingo' | 'minimal' | 'playful' | 'none';

export interface SoundSettings {
  enabled: boolean;
  theme: SoundTheme;
  volume: number;
}

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
  
  // Sound settings
  sound?: SoundSettings;
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
  sound: DEFAULT_SOUND_SETTINGS,
};

export const PRESET_THEMES: { id: string; name: string; config: Partial<DesignSystemConfig> }[] = [
  {
    id: 'default',
    name: 'По умолчанию',
    config: DEFAULT_DESIGN_SYSTEM,
  },
  {
    id: 'duolingo',
    name: 'Duolingo',
    config: {
      primaryColor: '142 71% 45%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '0 0% 100%',
      foregroundColor: '0 0% 20%',
      successColor: '142 71% 45%',
      borderRadius: '1rem',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'notion',
    name: 'Notion',
    config: {
      primaryColor: '0 0% 9%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '0 0% 100%',
      foregroundColor: '0 0% 9%',
      mutedColor: '0 0% 96%',
      borderRadius: '0.375rem',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'ocean',
    name: 'Океан',
    config: {
      primaryColor: '199 89% 48%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '200 20% 98%',
      foregroundColor: '200 50% 10%',
      accentColor: '199 89% 90%',
      borderRadius: '1rem',
      buttonStyle: 'pill',
    },
  },
  {
    id: 'sunset',
    name: 'Закат',
    config: {
      primaryColor: '25 95% 53%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '30 20% 98%',
      foregroundColor: '20 30% 15%',
      accentColor: '25 95% 90%',
      successColor: '142 71% 45%',
      borderRadius: '1.5rem',
      buttonStyle: 'pill',
    },
  },
  {
    id: 'dark',
    name: 'Тёмная',
    config: {
      primaryColor: '262 83% 58%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '240 10% 4%',
      foregroundColor: '0 0% 95%',
      cardColor: '240 10% 8%',
      mutedColor: '240 5% 15%',
      borderRadius: '0.75rem',
      buttonStyle: 'rounded',
    },
  },
  {
    id: 'forest',
    name: 'Лес',
    config: {
      primaryColor: '160 60% 35%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '120 10% 98%',
      foregroundColor: '160 40% 10%',
      accentColor: '160 60% 90%',
      successColor: '160 60% 35%',
      borderRadius: '0.5rem',
      buttonStyle: 'rounded',
    },
  },
];

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
