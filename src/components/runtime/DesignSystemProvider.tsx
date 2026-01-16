import React, { useMemo } from 'react';
import { DesignSystemConfig, DEFAULT_DESIGN_SYSTEM } from '@/types/designSystem';

interface DesignSystemProviderProps {
  config?: Partial<DesignSystemConfig>;
  children: React.ReactNode;
}

export const DesignSystemProvider: React.FC<DesignSystemProviderProps> = ({
  config,
  children,
}) => {
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_DESIGN_SYSTEM,
    ...config,
  }), [config]);

  const cssVariables = useMemo(() => {
    const buttonRadiusMap: Record<string, string> = {
      'rounded': mergedConfig.borderRadius,
      'pill': '9999px',
      'square': '0',
    };

    return {
      '--ds-primary': mergedConfig.primaryColor,
      '--ds-primary-foreground': mergedConfig.primaryForeground,
      '--ds-background': mergedConfig.backgroundColor,
      '--ds-foreground': mergedConfig.foregroundColor,
      '--ds-card': mergedConfig.cardColor,
      '--ds-muted': mergedConfig.mutedColor,
      '--ds-accent': mergedConfig.accentColor,
      '--ds-success': mergedConfig.successColor,
      '--ds-destructive': mergedConfig.destructiveColor,
      '--ds-radius': mergedConfig.borderRadius,
      '--ds-button-radius': buttonRadiusMap[mergedConfig.buttonStyle] || mergedConfig.borderRadius,
      '--ds-font-family': mergedConfig.fontFamily,
      '--ds-heading-font-family': mergedConfig.headingFontFamily,
    } as React.CSSProperties;
  }, [mergedConfig]);

  return (
    <div 
      className="design-system-scope"
      style={cssVariables}
    >
      {children}
    </div>
  );
};
