import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Primary blob - bottom center */}
      <div 
        className="absolute w-[600px] h-[400px] bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-[100px] motion-safe:animate-[blob-float-1_15s_ease-in-out_infinite] will-change-transform"
        style={{ background: 'hsl(270 40% 35% / 0.35)' }}
      />
      {/* Secondary blob - top right */}
      <div 
        className="absolute w-[400px] h-[300px] top-[10%] right-[5%] rounded-full blur-[80px] motion-safe:animate-[blob-float-2_20s_ease-in-out_infinite] will-change-transform"
        style={{ background: 'hsl(260 35% 40% / 0.25)' }}
      />
    </div>
  );
};

export default AnimatedBackground;
