import React from 'react';
import { DesignSystemConfig, DEFAULT_DESIGN_SYSTEM } from '@/types/designSystem';
import { cn } from '@/lib/utils';

interface ThemeMiniPreviewProps {
  config: DesignSystemConfig;
  className?: string;
}

/**
 * Mini preview showing how a theme looks with actual UI elements
 * Shows: background, heading text, button preview
 */
export const ThemeMiniPreview: React.FC<ThemeMiniPreviewProps> = ({
  config,
  className,
}) => {
  const primaryColor = config.primaryColor || DEFAULT_DESIGN_SYSTEM.primaryColor;
  const primaryForeground = config.primaryForeground || DEFAULT_DESIGN_SYSTEM.primaryForeground;
  const foregroundColor = config.foregroundColor || DEFAULT_DESIGN_SYSTEM.foregroundColor;
  
  // Get background from theme backgrounds or default
  const getBackgroundStyle = (): React.CSSProperties => {
    const backgrounds = config.themeBackgrounds || [];
    const defaultBg = backgrounds.find(bg => bg.id === config.defaultBackgroundId) || backgrounds[0];
    
    if (defaultBg) {
      if (defaultBg.type === 'gradient') {
        return {
          background: `linear-gradient(${defaultBg.angle || 135}deg, hsl(${defaultBg.from}), hsl(${defaultBg.to}))`,
        };
      }
      return { backgroundColor: `hsl(${defaultBg.color})` };
    }
    
    return { backgroundColor: `hsl(${config.backgroundColor || DEFAULT_DESIGN_SYSTEM.backgroundColor})` };
  };

  const buttonRadius = config.buttonStyle === 'pill' 
    ? '9999px' 
    : config.buttonStyle === 'square' 
      ? '4px' 
      : '6px';

  return (
    <div 
      className={cn(
        "rounded-lg overflow-hidden border border-border/50",
        className
      )}
      style={getBackgroundStyle()}
    >
      <div className="p-2 space-y-1.5">
        {/* Mini heading */}
        <div 
          className="text-[10px] font-bold truncate"
          style={{ color: `hsl(${foregroundColor})` }}
        >
          Заголовок
        </div>
        
        {/* Mini text line */}
        <div 
          className="h-1 w-3/4 rounded-full opacity-50"
          style={{ backgroundColor: `hsl(${foregroundColor})` }}
        />
        
        {/* Mini button */}
        <div
          className="h-4 w-full flex items-center justify-center text-[7px] font-bold uppercase tracking-wide"
          style={{
            backgroundColor: `hsl(${primaryColor})`,
            color: `hsl(${primaryForeground})`,
            borderRadius: buttonRadius,
            boxShadow: (config.buttonDepth ?? 'raised') === 'raised'
              ? `0 2px 0 0 hsl(${primaryColor} / 0.4)`
              : 'none',
          }}
        >
          Кнопка
        </div>
      </div>
    </div>
  );
};
