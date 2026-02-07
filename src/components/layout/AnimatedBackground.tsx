import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <>
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-[800px] h-[600px] -bottom-[200px] left-1/2 -translate-x-1/2 rounded-full blur-[120px] animate-[blob-float-1_12s_ease-in-out_infinite]"
          style={{ background: 'hsl(270 40% 35% / 0.4)' }}
        />
        <div 
          className="absolute w-[600px] h-[500px] -bottom-[150px] left-[10%] rounded-full blur-[100px] animate-[blob-float-2_15s_ease-in-out_infinite]"
          style={{ background: 'hsl(280 35% 40% / 0.3)' }}
        />
        <div 
          className="absolute w-[700px] h-[550px] -bottom-[180px] right-[5%] rounded-full blur-[110px] animate-[blob-float-3_18s_ease-in-out_infinite]"
          style={{ background: 'hsl(260 35% 45% / 0.35)' }}
        />
        <div 
          className="absolute w-[400px] h-[400px] top-[20%] left-[15%] rounded-full blur-[80px] animate-[blob-float-4_20s_ease-in-out_infinite]"
          style={{ background: 'hsl(250 30% 45% / 0.2)' }}
        />
        <div 
          className="absolute w-[350px] h-[350px] top-[15%] right-[20%] rounded-full blur-[70px] animate-[blob-float-5_16s_ease-in-out_infinite]"
          style={{ background: 'hsl(265 25% 40% / 0.2)' }}
        />
      </div>

      {/* Animated color overlay */}
      <div 
        className="absolute inset-0 pointer-events-none animate-[color-breathe_8s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 100%, hsl(270 45% 50% / 0.15), transparent 60%)' }}
      />
    </>
  );
};

export default AnimatedBackground;
