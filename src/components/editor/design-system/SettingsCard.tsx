import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

/**
 * A card component for grouping related settings
 * Supports collapsible mode for advanced settings
 */
export const SettingsCard: React.FC<SettingsCardProps> = ({
  icon,
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn(
          "rounded-xl border border-border bg-card/50 overflow-hidden transition-all",
          isOpen && "ring-1 ring-primary/10",
          className
        )}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                {description && (
                  <p className="text-xs text-muted-foreground truncate">{description}</p>
                )}
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border/50">
              <div className="pt-4">
                {children}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border border-border bg-card/50 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {children}
      </div>
    </div>
  );
};
