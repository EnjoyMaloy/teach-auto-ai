import React, { useState, useEffect } from 'react';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { CourseDesignSystem } from '@/types/course';
import { cn } from '@/lib/utils';
import { 
  Play, Volume2, Check, X,
  ChevronRight, RotateCcw, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from './AudioPlayer';
import { playSound, SoundConfig } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS } from '@/types/designSystem';

interface MobilePreviewFrameProps {
  block: Block | null;
  lessonTitle?: string;
  blockIndex?: number;
  totalBlocks?: number;
  onContinue?: () => void;
  designSystem?: CourseDesignSystem;
  isMuted?: boolean;
}

type AnswerState = 'idle' | 'correct' | 'incorrect';

// Default design system values
const DEFAULT_DS = {
  primaryColor: '262 83% 58%',
  primaryForeground: '0 0% 100%',
  backgroundColor: '0 0% 100%',
  foregroundColor: '240 10% 4%',
  cardColor: '0 0% 100%',
  mutedColor: '240 5% 96%',
  successColor: '142 71% 45%',
  destructiveColor: '0 84% 60%',
  fontFamily: 'Inter, system-ui, sans-serif',
  headingFontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: '0.75rem',
  buttonStyle: 'rounded' as const,
};

export const MobilePreviewFrame: React.FC<MobilePreviewFrameProps> = ({
  block,
  lessonTitle = 'Урок',
  blockIndex = 0,
  totalBlocks = 1,
  onContinue,
  designSystem,
  isMuted = false,
}) => {
  // Merge design system with defaults
  const ds = { ...DEFAULT_DS, ...designSystem };
  
  // Sound configuration
  const soundConfig: SoundConfig = {
    enabled: !isMuted && (designSystem?.sound?.enabled !== false),
    theme: designSystem?.sound?.theme ?? DEFAULT_SOUND_SETTINGS.theme,
    volume: designSystem?.sound?.volume ?? DEFAULT_SOUND_SETTINGS.volume,
  };
  
  // Interactive state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(50);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [matchingSelected, setMatchingSelected] = useState<{ left: string | null; pairs: Record<string, string> }>({ left: null, pairs: {} });
  const [orderingItems, setOrderingItems] = useState<string[]>([]);
  const [clickedHotspots, setClickedHotspots] = useState<string[]>([]);

  // Reset state when block changes
  useEffect(() => {
    resetState();
  }, [block?.id]);

  const resetState = () => {
    setSelectedOptions([]);
    setTrueFalseAnswer(null);
    setSliderValue(block?.sliderMin || 0);
    setFillBlankInput('');
    setAnswerState('idle');
    setMatchingSelected({ left: null, pairs: {} });
    setOrderingItems(block?.orderingItems ? [...block.orderingItems].sort(() => Math.random() - 0.5) : []);
    setClickedHotspots([]);
  };

  const checkAnswer = () => {
    if (!block) return;

    let isCorrect = false;

    switch (block.type) {
      case 'single_choice':
        const correctOption = block.options?.find(o => o.isCorrect);
        isCorrect = selectedOptions.length === 1 && selectedOptions[0] === correctOption?.id;
        break;
      case 'multiple_choice':
        const correctIds = block.options?.filter(o => o.isCorrect).map(o => o.id) || [];
        isCorrect = correctIds.length === selectedOptions.length && 
                    correctIds.every(id => selectedOptions.includes(id));
        break;
      case 'true_false':
        isCorrect = trueFalseAnswer === block.correctAnswer;
        break;
      case 'fill_blank':
        isCorrect = fillBlankInput.toLowerCase().trim() === (block.blankWord || '').toLowerCase().trim();
        break;
      case 'slider':
        const tolerance = ((block.sliderMax || 100) - (block.sliderMin || 0)) * 0.1;
        isCorrect = Math.abs(sliderValue - (block.sliderCorrect || 50)) <= tolerance;
        break;
      case 'matching':
        const allPairsCorrect = block.matchingPairs?.every(pair => 
          matchingSelected.pairs[pair.left] === pair.right
        ) || false;
        isCorrect = allPairsCorrect && Object.keys(matchingSelected.pairs).length === (block.matchingPairs?.length || 0);
        break;
      case 'ordering':
        isCorrect = JSON.stringify(orderingItems) === JSON.stringify(block.orderingItems);
        break;
      case 'hotspot':
        const correctAreas = block.hotspotAreas?.map(a => a.id) || [];
        isCorrect = correctAreas.length === clickedHotspots.length && 
                    correctAreas.every(id => clickedHotspots.includes(id));
        break;
    }

    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    
    // Play sound effect
    if (isCorrect) {
      playSound('correct', soundConfig);
    } else {
      playSound('incorrect', soundConfig);
    }
  };

  const handleContinue = () => {
    playSound('swipe', soundConfig);
    onContinue?.();
  };

  if (!block) {
    return (
      <div 
        className="h-full w-full flex items-center justify-center"
        style={{ 
          backgroundColor: `hsl(${ds.backgroundColor})`,
          fontFamily: ds.fontFamily,
        }}
      >
        <div className="text-center px-8">
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
          >
            <Play className="w-8 h-8" style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }} />
          </div>
          <p style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }} className="text-sm">
            Выберите блок для предпросмотра
          </p>
        </div>
      </div>
    );
  }

  const isInteractive = ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'slider', 'matching', 'ordering', 'hotspot'].includes(block.type);

  // Button depth and style
  const isRaised = designSystem?.buttonDepth !== 'flat';
  
  // Get button border radius based on style
  const getButtonRadius = () => {
    if (ds.buttonStyle === 'pill') return '9999px';
    if (ds.buttonStyle === 'square') return '0';
    return ds.borderRadius;
  };

  // Get raised button styles
  const getRaisedButtonStyle = (baseColor: string) => {
    if (!isRaised) return {};
    return {
      boxShadow: `0 4px 0 0 hsl(${baseColor} / 0.4), 0 6px 12px -2px hsl(${baseColor} / 0.25)`,
      transform: 'translateY(0)',
    };
  };

  // CSS class for press animation
  const pressAnimationClass = isRaised ? 'btn-raised' : 'btn-flat';

  const renderContent = () => {
    switch (block.type) {
      case 'heading':
        return (
          <div className="h-full flex items-center justify-center p-8">
            <h1 
              className="text-4xl font-bold text-center leading-tight"
              style={{ 
                color: `hsl(${ds.foregroundColor})`,
                fontFamily: ds.headingFontFamily,
              }}
            >
              {block.content || 'Заголовок'}
            </h1>
          </div>
        );

      case 'text':
        const textSizeClass = {
          small: 'text-sm',
          medium: 'text-base',
          large: 'text-xl',
          xlarge: 'text-2xl',
        }[block.textSize || 'medium'];
        
        return (
          <div className="h-full flex items-center justify-center p-8">
            <p 
              className={cn('leading-relaxed text-center', textSizeClass)}
              style={{ color: `hsl(${ds.foregroundColor})` }}
            >
              {block.content || 'Текст блока...'}
            </p>
          </div>
        );

      case 'image':
        return (
          <div className="h-full w-full flex items-center justify-center overflow-hidden">
            {block.imageUrl ? (
              <img 
                src={block.imageUrl} 
                alt="" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                <span className="text-muted-foreground text-sm">Нет изображения</span>
              </div>
            )}
          </div>
        );

      case 'video':
        // Extract YouTube video ID from various URL formats
        const getYouTubeId = (url: string) => {
          if (!url) return null;
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url.match(regExp);
          return match && match[2].length === 11 ? match[2] : null;
        };
        
        const isYouTubeVideo = block.videoUrl?.includes('youtube.com') || block.videoUrl?.includes('youtu.be');
        const videoId = isYouTubeVideo ? getYouTubeId(block.videoUrl || '') : null;
        
        return (
          <div className="h-full w-full flex items-center justify-center overflow-hidden bg-black">
            {videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : block.videoUrl ? (
              <video
                src={block.videoUrl}
                controls
                className="w-full h-full object-contain"
                playsInline
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
                <Play className="w-16 h-16 mb-4" />
                <p className="text-sm">Загрузите видео или вставьте ссылку</p>
              </div>
            )}
          </div>
        );

      case 'audio':
        return block.audioUrl ? (
          <AudioPlayer
            audioUrl={block.audioUrl}
            audioName={block.content}
            primaryColor={ds.primaryColor}
            foregroundColor={ds.foregroundColor}
            mutedColor={ds.mutedColor}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 gap-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
            >
              <Volume2 className="w-10 h-10" style={{ color: `hsl(${ds.foregroundColor} / 0.4)` }} />
            </div>
            <p 
              className="text-center font-medium"
              style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }}
            >
              Загрузите аудио файл
            </p>
          </div>
        );

      case 'image_text':
        return (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-muted flex items-center justify-center">
              {block.imageUrl ? (
                <img src={block.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-muted-foreground">Изображение</span>
              )}
            </div>
            <div className="p-4 bg-card">
              <p className="text-sm text-foreground">{block.content || 'Описание к картинке...'}</p>
            </div>
          </div>
        );

      case 'single_choice':
        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto">
            <p 
              className="text-lg font-semibold mb-4 text-center"
              style={{ color: `hsl(${ds.foregroundColor})` }}
            >
              {block.content || 'Вопрос?'}
            </p>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {(block.options || []).map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                const showResult = answerState !== 'idle';
                
                let borderColor = `hsl(${ds.mutedColor})`;
                let bgColor = `hsl(${ds.cardColor})`;
                let textColor = `hsl(${ds.foregroundColor})`;
                
                if (showResult && option.isCorrect) {
                  borderColor = `hsl(${ds.successColor})`;
                  bgColor = `hsl(${ds.successColor} / 0.1)`;
                  textColor = `hsl(${ds.successColor})`;
                } else if (showResult && isSelected && !option.isCorrect) {
                  borderColor = `hsl(${ds.destructiveColor})`;
                  bgColor = `hsl(${ds.destructiveColor} / 0.1)`;
                  textColor = `hsl(${ds.destructiveColor})`;
                } else if (!showResult && isSelected) {
                  borderColor = `hsl(${ds.primaryColor})`;
                  bgColor = `hsl(${ds.primaryColor} / 0.1)`;
                  textColor = `hsl(${ds.primaryColor})`;
                }
                
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (answerState !== 'idle') return;
                      setSelectedOptions([option.id]);
                    }}
                    className="w-full p-3 text-left transition-all text-sm border-2"
                    style={{
                      borderColor,
                      backgroundColor: bgColor,
                      color: textColor,
                      borderRadius: ds.borderRadius,
                    }}
                  >
                    <span className="font-medium">{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto">
            <p 
              className="text-lg font-semibold mb-4 text-center"
              style={{ color: `hsl(${ds.foregroundColor})` }}
            >
              {block.content || 'Вопрос?'}
            </p>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {(block.options || []).map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                const showResult = answerState !== 'idle';
                
                let borderColor = `hsl(${ds.mutedColor})`;
                let bgColor = `hsl(${ds.cardColor})`;
                let textColor = `hsl(${ds.foregroundColor})`;
                
                if (showResult && option.isCorrect) {
                  borderColor = `hsl(${ds.successColor})`;
                  bgColor = `hsl(${ds.successColor} / 0.1)`;
                  textColor = `hsl(${ds.successColor})`;
                } else if (showResult && isSelected && !option.isCorrect) {
                  borderColor = `hsl(${ds.destructiveColor})`;
                  bgColor = `hsl(${ds.destructiveColor} / 0.1)`;
                  textColor = `hsl(${ds.destructiveColor})`;
                } else if (!showResult && isSelected) {
                  borderColor = `hsl(${ds.primaryColor})`;
                  bgColor = `hsl(${ds.primaryColor} / 0.1)`;
                  textColor = `hsl(${ds.primaryColor})`;
                }
                
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (answerState !== 'idle') return;
                      setSelectedOptions(prev => 
                        prev.includes(option.id) 
                          ? prev.filter(id => id !== option.id)
                          : [...prev, option.id]
                      );
                    }}
                    className="w-full p-3 text-left transition-all text-sm border-2 flex items-center gap-2"
                    style={{
                      borderColor,
                      backgroundColor: bgColor,
                      color: textColor,
                      borderRadius: ds.borderRadius,
                    }}
                  >
                    <div 
                      className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                      style={{ 
                        borderColor: 'currentColor',
                        backgroundColor: isSelected ? 'currentColor' : 'transparent',
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3" style={{ color: `hsl(${ds.cardColor})` }} />}
                    </div>
                    <span className="font-medium">{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'true_false':
        const showTFResult = answerState !== 'idle';
        
        const getTFButtonStyle = (value: boolean) => {
          const isSelected = trueFalseAnswer === value;
          const isCorrectAnswer = block.correctAnswer === value;
          
          let borderColor = `hsl(${ds.mutedColor})`;
          let bgColor = `hsl(${ds.cardColor})`;
          let textColor = `hsl(${ds.foregroundColor})`;
          
          if (showTFResult && isCorrectAnswer) {
            borderColor = `hsl(${ds.successColor})`;
            bgColor = `hsl(${ds.successColor} / 0.1)`;
            textColor = `hsl(${ds.successColor})`;
          } else if (showTFResult && isSelected && !isCorrectAnswer) {
            borderColor = `hsl(${ds.destructiveColor})`;
            bgColor = `hsl(${ds.destructiveColor} / 0.1)`;
            textColor = `hsl(${ds.destructiveColor})`;
          } else if (!showTFResult && isSelected) {
            borderColor = `hsl(${ds.primaryColor})`;
            bgColor = `hsl(${ds.primaryColor} / 0.1)`;
            textColor = `hsl(${ds.primaryColor})`;
          }
          
          return { borderColor, backgroundColor: bgColor, color: textColor, borderRadius: ds.borderRadius };
        };
        
        return (
          <div className="flex-1 flex flex-col p-4">
            <p 
              className="text-lg font-semibold mb-6 text-center flex-1 flex items-center justify-center"
              style={{ color: `hsl(${ds.foregroundColor})` }}
            >
              {block.content || 'Утверждение верно?'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  if (answerState !== 'idle') return;
                  setTrueFalseAnswer(true);
                }}
                className="p-4 flex flex-col items-center gap-2 border-2 transition-all"
                style={getTFButtonStyle(true)}
              >
                <Check className="w-8 h-8" />
                <span className="font-semibold">Да</span>
              </button>
              <button 
                onClick={() => {
                  if (answerState !== 'idle') return;
                  setTrueFalseAnswer(false);
                }}
                className="p-4 flex flex-col items-center gap-2 border-2 transition-all"
                style={getTFButtonStyle(false)}
              >
                <X className="w-8 h-8" />
                <span className="font-semibold">Нет</span>
              </button>
            </div>
          </div>
        );

      case 'fill_blank':
        const parts = (block.content || 'Вставьте ___ слово').split('___');
        const showFBResult = answerState !== 'idle';
        const isCorrectFB = fillBlankInput.toLowerCase().trim() === (block.blankWord || '').toLowerCase().trim();
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <p className="text-lg text-center text-foreground">
              {parts[0]}
              <span className={cn(
                "inline-block mx-1 px-4 py-1 border-b-2 rounded-lg font-medium min-w-[80px]",
                showFBResult && isCorrectFB && "bg-success/10 border-success text-success",
                showFBResult && !isCorrectFB && "bg-destructive/10 border-destructive text-destructive",
                !showFBResult && "bg-primary/10 border-primary text-primary"
              )}>
                {fillBlankInput || '...'}
              </span>
              {parts[1]}
            </p>
            <input
              type="text"
              value={fillBlankInput}
              onChange={(e) => setFillBlankInput(e.target.value)}
              disabled={answerState !== 'idle'}
              placeholder="Введите ответ..."
              className="w-full max-w-[200px] px-4 py-2 rounded-xl border-2 border-border bg-card text-foreground text-center focus:border-primary focus:outline-none disabled:opacity-50"
            />
            {showFBResult && !isCorrectFB && (
              <p className="text-sm text-muted-foreground">
                Правильный ответ: <span className="text-success font-medium">{block.blankWord}</span>
              </p>
            )}
          </div>
        );

      case 'slider':
        const showSliderResult = answerState !== 'idle';
        const tolerance = ((block.sliderMax || 100) - (block.sliderMin || 0)) * 0.1;
        const isSliderCorrect = Math.abs(sliderValue - (block.sliderCorrect || 50)) <= tolerance;
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <p className="text-lg font-semibold text-center text-foreground">
              {block.content || 'Выберите значение'}
            </p>
            <div className="w-full">
              <input
                type="range"
                min={block.sliderMin || 0}
                max={block.sliderMax || 100}
                step={block.sliderStep || 1}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                disabled={answerState !== 'idle'}
                className="w-full accent-primary disabled:opacity-50"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{block.sliderMin || 0}</span>
                <span className={cn(
                  "font-bold",
                  showSliderResult && isSliderCorrect && "text-success",
                  showSliderResult && !isSliderCorrect && "text-destructive",
                  !showSliderResult && "text-primary"
                )}>
                  {sliderValue}
                </span>
                <span>{block.sliderMax || 100}</span>
              </div>
            </div>
            {showSliderResult && !isSliderCorrect && (
              <p className="text-sm text-muted-foreground">
                Правильный ответ: <span className="text-success font-medium">{block.sliderCorrect}</span>
              </p>
            )}
          </div>
        );

      case 'matching':
        const showMatchResult = answerState !== 'idle';
        const availableRights = (block.matchingPairs || [])
          .map(p => p.right)
          .filter(r => !Object.values(matchingSelected.pairs).includes(r));
        
        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto">
            <p className="text-lg font-semibold mb-4 text-center text-foreground">
              {block.content || 'Соедините пары'}
            </p>
            <div className="space-y-2">
              {(block.matchingPairs || []).map((pair) => {
                const selectedRight = matchingSelected.pairs[pair.left];
                const isCorrectPair = selectedRight === pair.right;
                
                return (
                  <div key={pair.id} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (answerState !== 'idle') return;
                        setMatchingSelected(prev => ({ ...prev, left: pair.left }));
                      }}
                      className={cn(
                        "flex-1 p-2.5 rounded-xl text-xs font-medium transition-all border-2",
                        matchingSelected.left === pair.left && "border-primary bg-primary/10 text-primary",
                        matchingSelected.left !== pair.left && "border-border bg-muted text-foreground",
                        showMatchResult && isCorrectPair && "border-success bg-success/10 text-success",
                        showMatchResult && selectedRight && !isCorrectPair && "border-destructive bg-destructive/10 text-destructive"
                      )}
                    >
                      {pair.left}
                    </button>
                    <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                    <div className={cn(
                      "flex-1 p-2.5 rounded-xl text-xs font-medium min-h-[36px] flex items-center justify-center",
                      selectedRight ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground border-2 border-dashed border-border",
                      showMatchResult && isCorrectPair && "bg-success/10 text-success",
                      showMatchResult && selectedRight && !isCorrectPair && "bg-destructive/10 text-destructive"
                    )}>
                      {selectedRight || '?'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {matchingSelected.left && !showMatchResult && (
              <div className="mt-4 p-3 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">Выберите пару для: <span className="text-primary font-medium">{matchingSelected.left}</span></p>
                <div className="flex flex-wrap gap-2">
                  {availableRights.map((right) => (
                    <button
                      key={right}
                      onClick={() => {
                        setMatchingSelected(prev => ({
                          left: null,
                          pairs: { ...prev.pairs, [prev.left!]: right }
                        }));
                      }}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-all"
                    >
                      {right}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'ordering':
        const showOrderResult = answerState !== 'idle';
        
        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto">
            <p className="text-lg font-semibold mb-4 text-center text-foreground">
              {block.content || 'Расположите в порядке'}
            </p>
            <div className="space-y-2">
              {orderingItems.map((item, idx) => {
                const correctIdx = block.orderingItems?.indexOf(item) ?? -1;
                const isCorrectPosition = correctIdx === idx;
                
                return (
                  <div
                    key={`${item}-${idx}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      showOrderResult && isCorrectPosition && "bg-success/10 border-success",
                      showOrderResult && !isCorrectPosition && "bg-destructive/10 border-destructive",
                      !showOrderResult && "bg-card border-border"
                    )}
                  >
                    <span className={cn(
                      "w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold",
                      showOrderResult && isCorrectPosition && "bg-success text-success-foreground",
                      showOrderResult && !isCorrectPosition && "bg-destructive text-destructive-foreground",
                      !showOrderResult && "bg-primary text-primary-foreground"
                    )}>
                      {idx + 1}
                    </span>
                    <span className="text-sm text-foreground flex-1">{item}</span>
                    {!showOrderResult && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            if (idx === 0) return;
                            const newItems = [...orderingItems];
                            [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
                            setOrderingItems(newItems);
                          }}
                          disabled={idx === 0}
                          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => {
                            if (idx === orderingItems.length - 1) return;
                            const newItems = [...orderingItems];
                            [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
                            setOrderingItems(newItems);
                          }}
                          disabled={idx === orderingItems.length - 1}
                          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'hotspot':
        const showHotspotResult = answerState !== 'idle';
        
        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto">
            <p className="text-lg font-semibold mb-4 text-center text-foreground">
              {block.content || 'Нажмите на правильные области'}
            </p>
            <div className="flex-1 relative bg-muted rounded-xl overflow-hidden border border-border min-h-[200px]">
              {block.imageUrl ? (
                <img src={block.imageUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Загрузите изображение</span>
                </div>
              )}
              {(block.hotspotAreas || []).map((area) => {
                const isClicked = clickedHotspots.includes(area.id);
                
                return (
                  <button
                    key={area.id}
                    onClick={() => {
                      if (answerState !== 'idle') return;
                      setClickedHotspots(prev => 
                        prev.includes(area.id)
                          ? prev.filter(id => id !== area.id)
                          : [...prev, area.id]
                      );
                    }}
                    className={cn(
                      "absolute rounded-lg transition-all",
                      showHotspotResult && "border-2 border-success bg-success/30",
                      !showHotspotResult && isClicked && "border-2 border-primary bg-primary/30",
                      !showHotspotResult && !isClicked && "border-2 border-transparent hover:border-primary/50 hover:bg-primary/10"
                    )}
                    style={{
                      left: `${area.x}%`,
                      top: `${area.y}%`,
                      width: `${area.width}%`,
                      height: `${area.height}%`,
                    }}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Выбрано: {clickedHotspots.length} / {block.hotspotAreas?.length || 0}
            </p>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Предпросмотр недоступен</p>
          </div>
        );
    }
  };

  return (
    <div 
      className="h-full w-full flex flex-col overflow-hidden"
      style={{ 
        backgroundColor: `hsl(${ds.backgroundColor})`,
        fontFamily: ds.fontFamily,
      }}
    >
      {/* Progress bar */}
      <div 
        className="h-10 flex items-center justify-between px-4 border-b shrink-0"
        style={{ 
          backgroundColor: `hsl(${ds.mutedColor} / 0.3)`,
          borderColor: `hsl(${ds.mutedColor})`,
        }}
      >
        <span className="text-xs" style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}>
          {lessonTitle}
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalBlocks, 20) }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                height: '6px',
                width: i === blockIndex ? '24px' : '8px',
                backgroundColor: i <= blockIndex 
                  ? `hsl(${ds.primaryColor}${i < blockIndex ? ' / 0.5' : ''})` 
                  : `hsl(${ds.mutedColor})`,
              }}
            />
          ))}
          {totalBlocks > 20 && (
            <span className="text-xs ml-1" style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}>
              +{totalBlocks - 20}
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}>
          {blockIndex + 1} / {totalBlocks}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>

      {/* Result feedback */}
      {answerState !== 'idle' && (
        <div 
          className="px-4 py-3 text-center text-sm font-medium shrink-0"
          style={{
            backgroundColor: answerState === 'correct' 
              ? `hsl(${ds.successColor} / 0.1)` 
              : `hsl(${ds.destructiveColor} / 0.1)`,
            color: answerState === 'correct' 
              ? `hsl(${ds.successColor})` 
              : `hsl(${ds.destructiveColor})`,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            {answerState === 'correct' ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Правильно!</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                <span>Неправильно</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div 
        className="h-16 border-t flex items-center justify-center gap-3 px-4 shrink-0"
        style={{ 
          backgroundColor: `hsl(${ds.cardColor})`,
          borderColor: `hsl(${ds.mutedColor})`,
        }}
      >
        {isInteractive && answerState !== 'idle' && (
          <button
            onClick={resetState}
            className={cn(
              "h-11 px-4 flex items-center gap-2 border-2 font-bold uppercase tracking-wide",
              pressAnimationClass
            )}
            style={{
              borderColor: `hsl(${ds.mutedColor})`,
              color: `hsl(${ds.foregroundColor})`,
              borderRadius: getButtonRadius(),
            }}
          >
            <RotateCcw className="w-4 h-4" />
            ЗАНОВО
          </button>
        )}
        <button
          onClick={() => {
            if (isInteractive && answerState === 'idle') {
              checkAnswer();
            } else {
              handleContinue();
            }
          }}
          className={cn(
            "flex-1 h-11 max-w-md font-bold uppercase tracking-wide disabled:opacity-50",
            pressAnimationClass
          )}
          disabled={isInteractive && answerState === 'idle' && selectedOptions.length === 0 && trueFalseAnswer === null && !fillBlankInput && Object.keys(matchingSelected.pairs).length === 0}
          style={{
            backgroundColor: `hsl(${ds.primaryColor})`,
            color: `hsl(${ds.primaryForeground})`,
            borderRadius: getButtonRadius(),
            ...getRaisedButtonStyle(ds.primaryColor),
          }}
        >
          {isInteractive && answerState === 'idle' ? 'ПРОВЕРИТЬ' : 'ПРОДОЛЖИТЬ'}
        </button>
      </div>
    </div>
  );
};
