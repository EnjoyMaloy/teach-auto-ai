import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dark theme blobs */}
      <div className="dark:block hidden">
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
      
      {/* Light theme pastel blobs */}
      <div className="dark:hidden block">
        {/* Purple blob - bottom left */}
        <div 
          className="absolute w-[500px] h-[350px] bottom-[5%] left-[10%] rounded-full blur-[120px] motion-safe:animate-[blob-float-1_18s_ease-in-out_infinite] will-change-transform"
          style={{ background: 'hsl(270 70% 80% / 0.5)' }}
        />
        {/* Yellow blob - top right */}
        <div 
          className="absolute w-[450px] h-[300px] top-[5%] right-[10%] rounded-full blur-[100px] motion-safe:animate-[blob-float-2_22s_ease-in-out_infinite] will-change-transform"
          style={{ background: 'hsl(45 85% 80% / 0.5)' }}
        />
        {/* Blue blob - center right */}
        <div 
          className="absolute w-[400px] h-[350px] top-[40%] right-[5%] rounded-full blur-[110px] motion-safe:animate-[blob-float-3_20s_ease-in-out_infinite] will-change-transform"
          style={{ background: 'hsl(210 75% 82% / 0.45)' }}
        />
        {/* Pink blob - top left */}
        <div 
          className="absolute w-[350px] h-[280px] top-[10%] left-[5%] rounded-full blur-[90px] motion-safe:animate-[blob-float-4_25s_ease-in-out_infinite] will-change-transform"
          style={{ background: 'hsl(330 70% 85% / 0.4)' }}
        />
        {/* Mint blob - bottom center */}
        <div 
          className="absolute w-[400px] h-[300px] bottom-[10%] left-1/2 -translate-x-1/2 rounded-full blur-[100px] motion-safe:animate-[blob-float-5_19s_ease-in-out_infinite] will-change-transform"
          style={{ background: 'hsl(160 60% 80% / 0.4)' }}
        />
      </div>
    </div>
  );
};

export default AnimatedBackground;
