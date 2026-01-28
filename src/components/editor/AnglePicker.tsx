import React, { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnglePickerProps {
  value: number;
  onChange: (angle: number) => void;
  className?: string;
}

export const AnglePicker: React.FC<AnglePickerProps> = ({ value, onChange, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return value;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    // Calculate angle in degrees (0° at top, clockwise)
    let angle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    return Math.round(angle);
  }, [value]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newAngle = calculateAngle(e.clientX, e.clientY);
    onChange(newAngle);
  }, [calculateAngle, onChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newAngle = calculateAngle(e.clientX, e.clientY);
    onChange(newAngle);
  }, [isDragging, calculateAngle, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const newAngle = calculateAngle(touch.clientX, touch.clientY);
    onChange(newAngle);
  }, [calculateAngle, onChange]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const newAngle = calculateAngle(touch.clientX, touch.clientY);
    onChange(newAngle);
  }, [isDragging, calculateAngle, onChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Calculate handle position based on angle
  const radius = 28; // Half of container size minus padding
  const handleX = Math.sin(value * Math.PI / 180) * radius;
  const handleY = -Math.cos(value * Math.PI / 180) * radius;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative w-16 h-16 rounded-full border-2 cursor-pointer select-none transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/50 hover:border-primary/50"
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gradient preview background */}
        <div 
          className="absolute inset-2 rounded-full opacity-30"
          style={{
            background: `linear-gradient(${value}deg, hsl(var(--primary)), hsl(var(--primary) / 0.2))`
          }}
        />
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/30" />
        
        {/* Direction line */}
        <div 
          className="absolute top-1/2 left-1/2 w-0.5 origin-bottom bg-primary"
          style={{
            height: `${radius}px`,
            transform: `translate(-50%, -100%) rotate(${value}deg)`
          }}
        />
        
        {/* Handle */}
        <div
          className={cn(
            "absolute w-4 h-4 rounded-full border-2 border-primary bg-background shadow-sm transition-transform",
            isDragging && "scale-110"
          )}
          style={{
            left: `calc(50% + ${handleX}px)`,
            top: `calc(50% + ${handleY}px)`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>
      
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-foreground">{value}°</span>
        <span className="text-xs text-muted-foreground">Угол</span>
      </div>
    </div>
  );
};
