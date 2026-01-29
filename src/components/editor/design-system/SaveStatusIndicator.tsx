import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  className,
}) => {
  if (status === 'idle') return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
        status === 'saving' && "bg-blue-100 text-blue-700",
        status === 'saved' && "bg-green-100 text-green-700",
        status === 'error' && "bg-red-100 text-red-700",
        className
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Сохранение...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3 h-3" />
          <span>Сохранено</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-3 h-3" />
          <span>Ошибка</span>
        </>
      )}
    </div>
  );
};
