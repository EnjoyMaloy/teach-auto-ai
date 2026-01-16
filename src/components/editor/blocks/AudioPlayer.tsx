import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  audioUrl: string;
  audioName?: string;
  primaryColor?: string;
  foregroundColor?: string;
  mutedColor?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  audioName,
  primaryColor = '262 83% 58%',
  foregroundColor = '240 10% 4%',
  mutedColor = '240 5% 96%',
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play();
    setIsPlaying(true);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 gap-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Title */}
      {audioName && (
        <p 
          className="text-lg font-semibold text-center max-w-[80%] truncate"
          style={{ color: `hsl(${foregroundColor})` }}
        >
          {audioName}
        </p>
      )}
      
      {/* Play button */}
      <button
        onClick={togglePlay}
        className="w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: `hsl(${primaryColor})` }}
      >
        {isPlaying ? (
          <Pause className="w-8 h-8 text-white" />
        ) : (
          <Play className="w-8 h-8 text-white ml-1" />
        )}
      </button>

      {/* Progress section */}
      <div className="w-full max-w-[280px] space-y-2">
        {/* Progress bar */}
        <div 
          className="relative h-2 rounded-full cursor-pointer overflow-hidden"
          style={{ backgroundColor: `hsl(${mutedColor})` }}
          onClick={handleSeek}
        >
          <div 
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
            style={{ 
              width: `${progress}%`,
              backgroundColor: `hsl(${primaryColor})`,
            }}
          />
          {/* Playhead */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md transition-all duration-100"
            style={{ 
              left: `calc(${progress}% - 8px)`,
              backgroundColor: `hsl(${primaryColor})`,
            }}
          />
        </div>

        {/* Time display */}
        <div 
          className="flex justify-between text-xs"
          style={{ color: `hsl(${foregroundColor} / 0.6)` }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Waveform visualization */}
      <div className="flex items-center justify-center gap-0.5 h-12 w-full max-w-[280px]">
        {Array.from({ length: 40 }).map((_, i) => {
          const isActive = (i / 40) * 100 <= progress;
          const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 25;
          
          return (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-150"
              style={{ 
                height: `${height}%`,
                backgroundColor: isActive 
                  ? `hsl(${primaryColor})`
                  : `hsl(${mutedColor})`,
              }}
            />
          );
        })}
      </div>

      {/* Restart button */}
      {currentTime > 0 && (
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: `hsl(${foregroundColor})` }}
        >
          <RotateCcw className="w-4 h-4" />
          Сначала
        </button>
      )}
    </div>
  );
};
