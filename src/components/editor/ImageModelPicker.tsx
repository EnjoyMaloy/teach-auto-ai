import React from 'react';
import { cn } from '@/lib/utils';
import { Check, ImageOff, Sparkles, Diamond, Timer } from 'lucide-react';

export type ImageModelId =
  | 'gpt-image-2-high'
  | 'gpt-image-2-medium'
  | 'gpt-image-2-low'
  | 'nano-banana-2'
  | 'nano-banana-pro'
  | 'imagine-art-2'
  // legacy aliases kept for backward compatibility with existing state
  | 'gemini-3-pro'
  | 'gemini-3.1-flash'
  | 'gemini-2.5-flash';

type Provider = 'openai' | 'google' | 'imagineart';

interface ModelEntry {
  id: ImageModelId;
  name: string;
  provider: Provider;
  quality: number;
  cost: number;
  disabled?: boolean;
}

export const IMAGE_MODELS: ModelEntry[] = [
  { id: 'gpt-image-2-high',    name: 'GPT Image 2 High',    provider: 'openai',     quality: 24, cost: 90 },
  { id: 'gpt-image-2-medium',  name: 'GPT Image 2 Medium',  provider: 'openai',     quality: 7,  cost: 45 },
  { id: 'gpt-image-2-low',     name: 'GPT Image 2 Low',     provider: 'openai',     quality: 2,  cost: 35 },
  { id: 'nano-banana-2',       name: 'Nano Banana 2',       provider: 'google',     quality: 11, cost: 25 },
  { id: 'nano-banana-pro',     name: 'Nano Banana Pro',     provider: 'google',     quality: 20, cost: 30 },
  { id: 'imagine-art-2',       name: 'ImagineArt 2.0',      provider: 'imagineart', quality: 8,  cost: 40, disabled: true },
];

/** Legacy → new id remap so existing state still highlights the right row */
const normalize = (id: string): ImageModelId => {
  if (id === 'gemini-3-pro') return 'nano-banana-pro';
  if (id === 'gemini-3.1-flash') return 'nano-banana-2';
  if (id === 'gemini-2.5-flash') return 'nano-banana-2';
  return id as ImageModelId;
};

const OpenAILogo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M22.28 9.82a6 6 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.06 6.06 0 0 0 4.98 4.18 6 6 0 0 0 .98 7.08a6.05 6.05 0 0 0 .74 7.1 6 6 0 0 0 .51 4.9 6.05 6.05 0 0 0 6.52 2.9A6 6 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 6 6 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zM13.26 22.43a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .4-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.5 4.5zM3.6 18.3a4.47 4.47 0 0 1-.54-3.01l.15.09 4.78 2.76a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06L9.74 19.95a4.5 4.5 0 0 1-6.14-1.65zM2.34 7.9a4.48 4.48 0 0 1 2.37-1.98V11.6a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.87zm16.6 3.85l-5.84-3.39L15.12 7.2a.08.08 0 0 1 .07 0l4.83 2.8a4.5 4.5 0 0 1-.68 8.1v-5.68a.79.79 0 0 0-.4-.67zm2.01-3.02l-.14-.09-4.78-2.78a.78.78 0 0 0-.78 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.8a4.5 4.5 0 0 1 6.68 4.67zm-12.64 4.14l-2.02-1.17a.08.08 0 0 1-.04-.06V6.08a4.5 4.5 0 0 1 7.38-3.46l-.14.08-4.78 2.76a.8.8 0 0 0-.4.68z" />
  </svg>
);

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1A6.62 6.62 0 0 1 5.48 12c0-.73.13-1.44.36-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.46 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

const ImagineLogo = () => (
  <Sparkles className="w-4 h-4 text-white" />
);

const ProviderBadge: React.FC<{ provider: Provider }> = ({ provider }) => {
  if (provider === 'openai') return (
    <div className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center text-foreground/90">
      <OpenAILogo />
    </div>
  );
  if (provider === 'google') return (
    <div className="w-9 h-9 rounded-lg border border-border bg-background flex items-center justify-center">
      <GoogleLogo />
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-600">
      <ImagineLogo />
    </div>
  );
};

interface Props {
  value: string;
  onChange: (id: ImageModelId) => void;
  skipImages: boolean;
  onSkipImagesChange: (v: boolean) => void;
}

export const ImageModelPicker: React.FC<Props> = ({ value, onChange, skipImages, onSkipImagesChange }) => {
  const active = normalize(value);

  return (
    <div className="space-y-1.5">
      {IMAGE_MODELS.map((m) => {
        const isActive = !skipImages && active === m.id;
        return (
          <button
            key={m.id}
            type="button"
            disabled={m.disabled}
            onClick={() => {
              if (m.disabled) return;
              onSkipImagesChange(false);
              onChange(m.id);
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left transition-all border",
              isActive
                ? "bg-primary/10 border-primary/40"
                : "bg-muted/20 border-border/60 hover:bg-muted/40",
              m.disabled && "opacity-50 cursor-not-allowed hover:bg-muted/20"
            )}
          >
            <ProviderBadge provider={m.provider} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold truncate text-foreground">{m.name}</span>
                {m.disabled && (
                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70">soon</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-0.5">
                  <Diamond className="w-2.5 h-2.5" />
                  {m.quality}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Timer className="w-2.5 h-2.5" />
                  {m.cost}c
                </span>
              </div>
            </div>
            {isActive && (
              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}

      {/* Без картинок */}
      <button
        type="button"
        onClick={() => onSkipImagesChange(true)}
        className={cn(
          "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-left transition-all border",
          skipImages
            ? "bg-primary/10 border-primary/40"
            : "bg-muted/20 border-border/60 hover:bg-muted/40"
        )}
      >
        <div className="w-9 h-9 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
          <ImageOff className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground">Без картинок</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Самый быстрый вариант</div>
        </div>
        {skipImages && (
          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Check className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        )}
      </button>
    </div>
  );
};
