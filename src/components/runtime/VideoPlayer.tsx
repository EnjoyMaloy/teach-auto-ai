import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  videoUrl: string;
  primaryColor?: string;
  foregroundColor?: string;
  mutedColor?: string;
}

const SPEEDS = [1, 1.25, 1.5, 1.75, 2];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  primaryColor = '262 83% 58%',
  foregroundColor = '0 0% 100%',
  mutedColor = '0 0% 100%',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => setDuration(v.duration || 0);
    const onTime = () => setCurrentTime(v.currentTime);
    const onEnded = () => setIsPlaying(false);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnded);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended', onEnded);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (videoRef.current) videoRef.current.playbackRate = SPEEDS[next];
  };

  const restart = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setCurrentTime(0);
    v.play();
    setIsPlaying(true);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * duration;
    setCurrentTime(v.currentTime);
  };

  const formatRemaining = (t: number) => {
    const r = Math.max(0, Math.floor(duration - t));
    const m = Math.floor(r / 60);
    const s = r % 60;
    return `-${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const pillBg = `hsl(${foregroundColor} / 0.08)`;
  const fg = `hsl(${foregroundColor})`;
  const fgMuted = `hsl(${foregroundColor} / 0.5)`;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Video area */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-full object-contain"
            playsInline
            onClick={togglePlay}
          />
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center"
              aria-label="Play"
            >
              <span
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                <Play className="w-8 h-8 ml-1" style={{ color: '#000' }} fill="#000" />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 px-4 pb-3 pt-4 space-y-3">
        {/* Progress bar */}
        <div
          className="relative h-1 rounded-full cursor-pointer"
          style={{ backgroundColor: `hsl(${mutedColor} / 0.2)` }}
          onClick={handleSeek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${progress}%`, backgroundColor: fg }}
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left pill: play / time / volume */}
          <div
            className="flex items-center gap-3 rounded-full px-3 py-2"
            style={{ backgroundColor: pillBg }}
          >
            <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <Pause className="w-5 h-5" style={{ color: fg }} fill={fg} />
              ) : (
                <Play className="w-5 h-5" style={{ color: fg }} fill={fg} />
              )}
            </button>
            <span className="text-sm tabular-nums" style={{ color: fg }}>
              {formatRemaining(currentTime)}
            </span>
            <button onClick={toggleMute} aria-label="Mute">
              {muted ? (
                <VolumeX className="w-5 h-5" style={{ color: fg }} />
              ) : (
                <Volume2 className="w-5 h-5" style={{ color: fg }} />
              )}
            </button>
          </div>

          {/* Right pill: speed / auto / restart */}
          <div
            className="flex items-center gap-4 rounded-full px-4 py-2"
            style={{ backgroundColor: pillBg }}
          >
            <button
              onClick={cycleSpeed}
              className="text-sm font-semibold"
              style={{ color: fg }}
            >
              {SPEEDS[speedIdx]}x
            </button>
            <span className="text-sm" style={{ color: fgMuted }}>
              Авто
            </span>
            <button onClick={restart} aria-label="Restart">
              <RotateCcw className="w-5 h-5" style={{ color: fg }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
