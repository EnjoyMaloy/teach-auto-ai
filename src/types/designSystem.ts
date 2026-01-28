// Design System configuration for courses

export type SoundTheme = 'duolingo' | 'minimal' | 'playful' | 'none';

export interface SoundSettings {
  enabled: boolean;
  theme: SoundTheme;
  volume: number;
}

export type ButtonDepth = 'flat' | 'raised';

// Background preset - can be solid or gradient
export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'solid' | 'gradient';
  // For solid backgrounds
  color?: string;
  // For gradient backgrounds
  from?: string;
  to?: string;
  angle?: number;
}

// 5 default background presets (mix of solid and gradient)
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'white', name: 'Белый', type: 'solid', color: '0 0% 100%' },
  { id: 'cream', name: 'Кремовый', type: 'solid', color: '40 30% 97%' },
  { id: 'lavender', name: 'Лаванда', type: 'gradient', from: '262 83% 96%', to: '220 70% 96%', angle: 135 },
  { id: 'peach', name: 'Персик', type: 'gradient', from: '30 100% 96%', to: '350 80% 96%', angle: 135 },
  { id: 'mint', name: 'Мята', type: 'gradient', from: '160 50% 94%', to: '200 50% 96%', angle: 135 },
];

// Google-themed background presets (5 solid + 5 gradient)
export const GOOGLE_BACKGROUND_PRESETS: BackgroundPreset[] = [
  // Solid backgrounds
  { id: 'google-white', name: 'Белый', type: 'solid', color: '0 0% 100%' },
  { id: 'google-light-gray', name: 'Светло-серый', type: 'solid', color: '210 17% 98%' },
  { id: 'google-blue-tint', name: 'Голубой', type: 'solid', color: '214 100% 97%' },
  { id: 'google-green-tint', name: 'Зелёный', type: 'solid', color: '142 60% 96%' },
  { id: 'google-yellow-tint', name: 'Жёлтый', type: 'solid', color: '45 100% 96%' },
  // Gradient backgrounds
  { id: 'google-blue-gradient', name: 'Синий градиент', type: 'gradient', from: '214 100% 97%', to: '200 80% 94%', angle: 135 },
  { id: 'google-sunset', name: 'Закат', type: 'gradient', from: '45 100% 96%', to: '5 90% 95%', angle: 135 },
  { id: 'google-ocean', name: 'Океан', type: 'gradient', from: '200 80% 96%', to: '142 60% 94%', angle: 180 },
  { id: 'google-candy', name: 'Конфета', type: 'gradient', from: '5 90% 96%', to: '280 70% 95%', angle: 120 },
  { id: 'google-aurora', name: 'Аврора', type: 'gradient', from: '142 60% 96%', to: '214 100% 94%', angle: 160 },
];

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
  
  // Progress bar colors
  progressActiveColor?: string;      // Current/active slide indicator
  progressInactiveColor?: string;    // Not yet visited slides
  progressCompletedColor?: string;   // Already completed slides
  progressBackdropColor?: string;    // Background behind progress bar
  
  // Continue button backdrop
  buttonBackdropColor?: string;      // Background behind continue button
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
  
  // === RIVE ANIMATION SETTINGS ===
  // Whether Rive mascot is enabled (shows in quiz slides)
  riveEnabled?: boolean;
  // URL to .riv file (stored in Supabase storage)
  riveUrl?: string;
  // State machine name in the Rive file
  riveStateMachine?: string;
  // Input names for triggering states
  riveIdleState?: string;      // Default/waiting state
  riveCorrectState?: string;   // Triggered on correct answer
  riveIncorrectState?: string; // Triggered on incorrect answer
  // Mascot position in quiz slides
  rivePosition?: 'top' | 'bottom' | 'left' | 'right';
  // Mascot size
  riveSize?: 'small' | 'medium' | 'large';
}

export const DEFAULT_MASCOT_SETTINGS: MascotSettings = {
  prompt: '',
  style: 'flat vector illustration',
  approvedImageUrl: '',
  isApproved: false,
  name: '',
  personality: '',
  riveEnabled: false,
  riveUrl: '',
  riveStateMachine: 'Duo State Machine',
  riveIdleState: 'Idle',
  riveCorrectState: 'Jump',
  riveIncorrectState: 'Left hand out',
  rivePosition: 'top',
  riveSize: 'medium',
};

export const DEFAULT_DESIGN_BLOCK_SETTINGS: Required<DesignBlockSettings> = {
  backdropLightColor: '0 0% 0% / 0.05',
  backdropDarkColor: '0 0% 0% / 0.9',
  backdropPrimaryColor: '262 83% 58% / 0.1',
  backdropBlurColor: '0 0% 0% / 0.03',
  highlightMarkerColor: '50 100% 50% / 0.4',
  highlightUnderlineColor: '262 83% 58%',
  highlightWavyColor: '0 84% 60%',
  // Progress bar defaults
  progressActiveColor: '262 83% 58%',        // Primary color
  progressInactiveColor: '0 0% 0% / 0.15',   // Light gray
  progressCompletedColor: '262 83% 58%',     // Primary color (same as active)
  progressBackdropColor: '0 0% 0% / 0.05',   // Very subtle backdrop
  // Button backdrop
  buttonBackdropColor: '0 0% 100% / 0.9',    // White with slight transparency
};

export type BackgroundType = 'solid' | 'gradient';

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
  
  // Theme ID (to persist which theme is selected)
  themeId?: string;
  
  // Theme backgrounds - up to 5 backgrounds that can be used in blocks
  themeBackgrounds?: BackgroundPreset[];
  
  // Default background for new blocks (references themeBackgrounds by id)
  defaultBackgroundId?: string;
  
  // Legacy background fields (kept for backward compatibility)
  backgroundPresetId?: string;
  backgroundType?: BackgroundType;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  
  // Typography
  fontFamily: string;
  headingFontFamily: string;
  
  // Border radius
  borderRadius: string;
  
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
  backgroundPresetId: 'white',
  backgroundType: 'solid',
  gradientFrom: '262 83% 95%',
  gradientTo: '200 83% 95%',
  gradientAngle: 135,
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
  backgroundPresets?: BackgroundPreset[]; // Theme-specific background presets
}

// Base themes that cannot be deleted
export const BASE_THEMES: ThemePreset[] = [
  {
    id: 'google',
    name: 'Google',
    config: {
      // Google Blue #1A73E8
      primaryColor: '214 82% 51%',
      primaryForeground: '0 0% 100%',
      // Clean white background
      backgroundColor: '0 0% 100%',
      foregroundColor: '213 5% 25%',
      cardColor: '0 0% 100%',
      // Light gray muted #F1F3F4
      mutedColor: '210 17% 95%',
      accentColor: '214 82% 95%',
      // Google Green #34A853
      successColor: '142 53% 43%',
      // Google Red #EA4335
      destructiveColor: '5 81% 56%',
      // Material Design uses 4-8px radius
      borderRadius: '0.5rem',
      buttonStyle: 'rounded',
      buttonDepth: 'flat',
      // Roboto is Google's signature font
      fontFamily: '"Roboto", system-ui, sans-serif',
      headingFontFamily: '"Roboto", system-ui, sans-serif',
      // Default background preset for Google theme
      backgroundPresetId: 'google-white',
      backgroundType: 'solid',
    },
    isCustom: false,
    backgroundPresets: GOOGLE_BACKGROUND_PRESETS,
  },
  {
    id: 'notion',
    name: 'Notion',
    config: {
      // Notion's dark text/primary #37352F
      primaryColor: '30 11% 20%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '0 0% 100%',
      foregroundColor: '30 11% 20%',
      cardColor: '0 0% 100%',
      // Notion's light gray
      mutedColor: '45 9% 95%',
      accentColor: '45 9% 93%',
      successColor: '142 53% 43%',
      destructiveColor: '0 72% 51%',
      // Notion uses very subtle rounding
      borderRadius: '0.25rem',
      buttonStyle: 'rounded',
      buttonDepth: 'flat',
      // Notion uses system fonts with serif for some headers
      fontFamily: 'system-ui, -apple-system, sans-serif',
      headingFontFamily: 'Georgia, serif',
    },
    isCustom: false,
  },
  {
    id: 'apple',
    name: 'Apple',
    config: {
      // Apple Blue #007AFF
      primaryColor: '211 100% 50%',
      primaryForeground: '0 0% 100%',
      // Clean white
      backgroundColor: '0 0% 100%',
      // Apple's dark gray text #1D1D1F
      foregroundColor: '240 2% 12%',
      cardColor: '0 0% 100%',
      // Light gray #F5F5F7
      mutedColor: '240 5% 96%',
      accentColor: '211 100% 96%',
      // Apple Green #34C759
      successColor: '142 69% 49%',
      // Apple Red #FF3B30
      destructiveColor: '4 100% 59%',
      // Apple uses generous rounding
      borderRadius: '0.75rem',
      buttonStyle: 'rounded',
      buttonDepth: 'flat',
      // SF Pro is Apple's signature font
      fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif',
      headingFontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif',
    },
    isCustom: false,
  },
  {
    id: 'duolingo',
    name: 'Duolingo',
    config: {
      // Duolingo Green #58CC02
      primaryColor: '98 98% 40%',
      primaryForeground: '0 0% 100%',
      backgroundColor: '0 0% 100%',
      // Duolingo's dark text #4B4B4B
      foregroundColor: '0 0% 29%',
      cardColor: '0 0% 100%',
      // Light background
      mutedColor: '0 0% 96%',
      accentColor: '98 98% 95%',
      // Same green for success
      successColor: '98 98% 40%',
      // Duolingo Red #FF4B4B
      destructiveColor: '0 100% 65%',
      // Duolingo uses very rounded, playful corners
      borderRadius: '1rem',
      buttonStyle: 'rounded',
      // Duolingo has signature 3D raised buttons
      buttonDepth: 'raised',
      // Nunito is similar to Duolingo's Din Round
      fontFamily: '"Nunito", system-ui, sans-serif',
      headingFontFamily: '"Nunito", system-ui, sans-serif',
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
