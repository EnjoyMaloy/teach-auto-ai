import React, { useState, useEffect, useRef } from 'react';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { CourseDesignSystem } from '@/types/course';
import { DesignSystemConfig } from '@/types/designSystem';
import { cn } from '@/lib/utils';
import { 
  Play, Volume2, Check, X,
  ChevronRight, RotateCcw, Sparkles, Zap, AlertCircle
} from 'lucide-react';
import { getSoftBackgroundColor, getDarkTextColor, getButtonShadowColor } from '@/lib/colorUtils';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from './AudioPlayer';
import { DesignBlockEditor } from './DesignBlockEditor';
import { playSound, SoundConfig } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS, DEFAULT_DESIGN_BLOCK_SETTINGS, BackgroundPreset } from '@/types/designSystem';
import { RiveMascot } from '@/components/runtime/RiveMascot';

// Fixed preview dimensions - using iPhone 14/15 Pro proportions for better visual balance
// These are "virtual" internal dimensions that get scaled to fit the container
const PREVIEW_BASE_WIDTH = 390; // CSS pixels
const PREVIEW_BASE_HEIGHT = 760; // Slightly shorter than full iPhone height for better proportions

// Hook to scale preview content to fit container while maintaining fixed internal dimensions
const usePreviewScale = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Calculate scale to fit content in container
      const scaleX = containerWidth / PREVIEW_BASE_WIDTH;
      const scaleY = containerHeight / PREVIEW_BASE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);
      
      setScale(newScale);
    };
    
    updateScale();
    
    // Use ResizeObserver for more reliable size detection
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);
  
  return scale;
};

interface MobilePreviewFrameProps {
  block: Block | null;
  lessonTitle?: string;
  blockIndex?: number;
  totalBlocks?: number;
  onContinue?: () => void;
  onUpdateBlock?: (updates: Partial<Block>) => void;
  designSystem?: CourseDesignSystem | DesignSystemConfig;
  isMuted?: boolean;
  isReadOnly?: boolean;
  /** If true, renders without the outer container/scaling - for embedding in CoursePlayer */
  embedded?: boolean;
  /** If true, hides the progress bar header - useful when parent component has its own */
  hideHeader?: boolean;
  /** If true, fills the container 100% without zoom scaling - for fullscreen/public view */
  fillContainer?: boolean;
  /** Selected sub-block ID for design blocks */
  selectedSubBlockId?: string | null;
  /** Callback when sub-block is selected */
  onSelectSubBlock?: (id: string | null) => void;
}

type AnswerState = 'idle' | 'correct' | 'incorrect' | 'partial';

// Default design system values
const DEFAULT_DS = {
  primaryColor: '262 83% 58%',
  primaryForeground: '0 0% 100%',
  backgroundColor: '0 0% 100%',
  foregroundColor: '240 10% 4%',
  cardColor: '0 0% 100%',
  mutedColor: '240 5% 96%',
  successColor: '142 71% 45%',
  partialColor: '35 92% 50%',
  destructiveColor: '0 84% 60%',
  fontFamily: '"Inter", sans-serif',
  headingFontFamily: '"Inter", sans-serif',
  borderRadius: '0.75rem',
  buttonStyle: 'rounded' as const,
  backgroundType: 'solid' as 'solid' | 'gradient',
  gradientFrom: '262 83% 95%',
  gradientTo: '200 83% 95%',
  gradientAngle: 135,
  // Hint colors
  hintBackgroundColor: '240 5% 96%',
  hintBorderColor: '240 5% 90%',
  hintTextColor: '240 10% 30%',
  hintIconColor: '262 83% 58%',
};

// Calculate background style based on design system and optional block-specific background
const getBackgroundStyle = (ds: { 
  backgroundColor: string; 
  backgroundType?: 'solid' | 'gradient'; 
  gradientFrom?: string; 
  gradientTo?: string; 
  gradientAngle?: number;
  themeBackgrounds?: BackgroundPreset[];
  defaultBackgroundId?: string;
}, blockBackgroundId?: string): React.CSSProperties => {
  // Priority: block-specific backgroundId > defaultBackgroundId
  const targetBackgroundId = blockBackgroundId || ds.defaultBackgroundId;
  
  // Check if we have themeBackgrounds and a target background id
  if (ds.themeBackgrounds && ds.themeBackgrounds.length > 0 && targetBackgroundId) {
    const preset = ds.themeBackgrounds.find(bg => bg.id === targetBackgroundId);
    if (preset) {
      if (preset.type === 'gradient' && preset.from && preset.to) {
        return {
          background: `linear-gradient(${preset.angle || 135}deg, hsl(${preset.from}), hsl(${preset.to}))`,
        };
      }
      if (preset.type === 'solid' && preset.color) {
        return { backgroundColor: `hsl(${preset.color})` };
      }
    }
  }
  
  // Fallback to legacy fields
  if (ds.backgroundType === 'gradient' && ds.gradientFrom && ds.gradientTo) {
    return {
      background: `linear-gradient(${ds.gradientAngle || 135}deg, hsl(${ds.gradientFrom}), hsl(${ds.gradientTo}))`,
    };
  }
  return { backgroundColor: `hsl(${ds.backgroundColor})` };
};

export const MobilePreviewFrame: React.FC<MobilePreviewFrameProps> = ({
  block,
  lessonTitle = 'Урок',
  blockIndex = 0,
  totalBlocks = 1,
  onContinue,
  onUpdateBlock,
  designSystem,
  isMuted = false,
  isReadOnly = false,
  embedded = false,
  hideHeader = false,
  fillContainer = false,
  selectedSubBlockId,
  onSelectSubBlock,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Scale preview to fit container while maintaining fixed internal dimensions
  const previewScale = usePreviewScale(containerRef);
  
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
  const [shuffledRights, setShuffledRights] = useState<string[]>([]);
  const [orderingItems, setOrderingItems] = useState<string[]>([]);

  // Reset state when block changes
  useEffect(() => {
    resetState();
  }, [block?.id]);

  // Update ordering items when block content changes (for live preview in editor)
  useEffect(() => {
    if (block?.orderingItems && answerState === 'idle') {
      // Only update if items have changed and user hasn't started interacting
      setOrderingItems([...block.orderingItems].sort(() => Math.random() - 0.5));
    }
  }, [JSON.stringify(block?.orderingItems)]);

  // Update matching pairs when block content changes
  useEffect(() => {
    if (block?.matchingPairs && answerState === 'idle') {
      setShuffledRights([...block.matchingPairs.map(p => p.right)].sort(() => Math.random() - 0.5));
    }
  }, [JSON.stringify(block?.matchingPairs)]);

  // Hint state
  const [shownHintIndex, setShownHintIndex] = useState(-1);

  const resetState = () => {
    setSelectedOptions([]);
    setTrueFalseAnswer(null);
    setSliderValue(block?.sliderMin || 0);
    setFillBlankInput('');
    setAnswerState('idle');
    setShownHintIndex(-1);
    setMatchingSelected({ left: null, pairs: {} });
    // Shuffle right options for matching
    if (block?.matchingPairs) {
      setShuffledRights([...block.matchingPairs.map(p => p.right)].sort(() => Math.random() - 0.5));
    }
    setOrderingItems(block?.orderingItems ? [...block.orderingItems].sort(() => Math.random() - 0.5) : []);
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
        const allCorrectSelected = correctIds.every(id => selectedOptions.includes(id));
        const noIncorrectSelected = selectedOptions.every(id => correctIds.includes(id));
        
        if (allCorrectSelected && noIncorrectSelected) {
          isCorrect = true;
        } else if (noIncorrectSelected && selectedOptions.length > 0 && selectedOptions.length < correctIds.length) {
          // Partial - selected some correct but not all, and no incorrect
          setAnswerState('partial');
          playSound('incorrect', soundConfig);
          return;
        } else {
          isCorrect = false;
        }
        break;
      case 'true_false':
        isCorrect = trueFalseAnswer === block.correctAnswer;
        break;
      case 'fill_blank':
        isCorrect = fillBlankInput.toLowerCase().trim() === (block.blankWord || '').toLowerCase().trim();
        break;
      case 'slider':
        // Support range or exact answer with tolerance
        if (block.sliderCorrectMax !== undefined) {
          isCorrect = sliderValue >= (block.sliderCorrect || 0) && sliderValue <= block.sliderCorrectMax;
        } else {
          const tolerance = ((block.sliderMax || 100) - (block.sliderMin || 0)) * 0.05;
          isCorrect = Math.abs(sliderValue - (block.sliderCorrect || 50)) <= tolerance;
        }
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
    }

    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    
    // Play sound effect
    if (isCorrect) {
      playSound('correct', soundConfig);
    } else {
      playSound('incorrect', soundConfig);
    }
  };

  // Check if user has made a selection and can check their answer
  const canCheck = (): boolean => {
    if (!block) return false;
    
    switch (block.type) {
      case 'single_choice':
      case 'multiple_choice':
        return selectedOptions.length > 0;
      case 'true_false':
        return trueFalseAnswer !== null;
      case 'fill_blank':
        return fillBlankInput.trim().length > 0;
      case 'slider':
        return true; // Slider always has a value
      case 'matching':
        return Object.keys(matchingSelected.pairs).length > 0;
      case 'ordering':
        return orderingItems.length > 0;
      default:
        return false;
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
          ...getBackgroundStyle(ds, undefined),
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
            Выберите блок для Fast View
          </p>
        </div>
      </div>
    );
  }

  const isInteractive = ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'slider', 'matching', 'ordering'].includes(block.type);

  // Mascot settings
  const mascotSettings = designSystem?.mascot;
  const showMascot = mascotSettings?.riveEnabled && mascotSettings?.riveUrl && isInteractive;
  const mascotState: 'idle' | 'correct' | 'incorrect' = 
    answerState === 'correct' ? 'correct' : 
    answerState === 'incorrect' || answerState === 'partial' ? 'incorrect' : 'idle';

  // Render mascot component
  const renderMascot = () => {
    if (!showMascot || !mascotSettings) return null;

    // Absolute positioning at top, below progress bar
    return (
      <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-10">
        <RiveMascot 
          settings={mascotSettings} 
          state={mascotState}
        />
      </div>
    );
  };

  // Button depth and style
  const isRaised = designSystem?.buttonDepth !== 'flat';
  
  // Get button border radius based on style
  const getButtonRadius = () => {
    if (ds.buttonStyle === 'pill') return '9999px';
    if (ds.buttonStyle === 'square') return '0';
    return ds.borderRadius;
  };

  // Get raised button styles with properly derived shadow color
  const getRaisedButtonStyle = (baseColor: string) => {
    if (!isRaised) return {};
    const shadowColor = getButtonShadowColor(baseColor);
    return {
      boxShadow: `0 4px 0 0 hsl(${shadowColor}), 0 6px 12px -2px hsl(${baseColor} / 0.25)`,
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
          <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 h-full min-h-0">
            {block.imageUrl && (
              <img src={block.imageUrl} alt="" className="w-full rounded-2xl object-contain max-h-[60%]" />
            )}
            <p className="text-lg text-center" style={{ color: `hsl(${ds.foregroundColor})` }}>{block.content || 'Описание к картинке...'}</p>
          </div>
        );

      case 'design':
        return (
          <DesignBlockEditor
            subBlocks={block.subBlocks || []}
            onUpdateSubBlocks={isReadOnly ? undefined : (subBlocks) => onUpdateBlock?.({ subBlocks })}
            designSystem={designSystem}
            isEditing={!isReadOnly}
            selectedSubBlockId={selectedSubBlockId}
            onSelectSubBlock={onSelectSubBlock}
          />
        );

      case 'single_choice':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto relative z-0 h-full min-h-0">
            {/* Mascot top */}
            {mascotSettings?.rivePosition === 'top' && renderMascot()}
            <div className="w-full flex-1 flex flex-col justify-center">
              <p 
                className="text-lg font-semibold mb-4 text-center"
                style={{ color: `hsl(${ds.foregroundColor})` }}
              >
                {block.content || 'Вопрос?'}
              </p>
              <div className="space-y-2">
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
                    const accentColor = designSystem?.designBlock?.accentElementColor || ds.primaryColor;
                    borderColor = `hsl(${accentColor})`;
                    bgColor = `hsl(${accentColor} / 0.1)`;
                    textColor = `hsl(${accentColor})`;
                  }
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (answerState !== 'idle') return;
                        setSelectedOptions([option.id]);
                      }}
                      disabled={answerState !== 'idle'}
                      className="w-full p-3 text-left transition-all text-sm border-2 cursor-pointer"
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
            {/* Mascot bottom */}
            {mascotSettings?.rivePosition === 'bottom' && renderMascot()}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto relative z-0 h-full min-h-0">
            {/* Mascot top */}
            {mascotSettings?.rivePosition === 'top' && renderMascot()}
            <div className="w-full flex-1 flex flex-col justify-center">
              <p
                style={{ color: `hsl(${ds.foregroundColor})` }}
              >
                {block.content || 'Вопрос?'}
              </p>
              <div className="space-y-2">
                {(block.options || []).map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  const showResult = answerState !== 'idle';
                  
                  let borderColor = `hsl(${ds.mutedColor})`;
                  let bgColor = `hsl(${ds.cardColor})`;
                  let textColor = `hsl(${ds.foregroundColor})`;
                  
                  // For partial state, use the partial color from design system
                  const partialColorVal = ds.partialColor || '35 92% 50%';
                  const correctColor = answerState === 'partial' ? partialColorVal : ds.successColor;
                  const correctBgColor = answerState === 'partial' ? `${partialColorVal} / 0.15` : `${ds.successColor} / 0.1`;
                  
                  if (showResult && option.isCorrect && isSelected) {
                    // Selected correct answer
                    borderColor = `hsl(${correctColor})`;
                    bgColor = `hsl(${correctBgColor})`;
                    textColor = `hsl(${correctColor})`;
                  } else if (showResult && option.isCorrect && !isSelected && answerState !== 'partial') {
                    // Unselected correct answer - only show for non-partial states
                    borderColor = `hsl(${ds.successColor})`;
                    bgColor = `hsl(${ds.successColor} / 0.1)`;
                    textColor = `hsl(${ds.successColor})`;
                  } else if (showResult && isSelected && !option.isCorrect) {
                    borderColor = `hsl(${ds.destructiveColor})`;
                    bgColor = `hsl(${ds.destructiveColor} / 0.1)`;
                    textColor = `hsl(${ds.destructiveColor})`;
                  } else if (!showResult && isSelected) {
                    const accentColor = designSystem?.designBlock?.accentElementColor || ds.primaryColor;
                    borderColor = `hsl(${accentColor})`;
                    bgColor = `hsl(${accentColor} / 0.1)`;
                    textColor = `hsl(${accentColor})`;
                  }
                  
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (answerState !== 'idle') return;
                        setSelectedOptions(prev => 
                          prev.includes(option.id) 
                            ? prev.filter(id => id !== option.id)
                            : [...prev, option.id]
                        );
                      }}
                      disabled={answerState !== 'idle'}
                      className="w-full p-3 text-left transition-all text-sm border-2 flex items-center gap-2 cursor-pointer"
                      style={{
                        borderColor,
                        backgroundColor: bgColor,
                        color: textColor,
                        borderRadius: ds.borderRadius,
                      }}
                    >
                      <div 
                        className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 pointer-events-none"
                        style={{ 
                          borderColor: 'currentColor',
                          backgroundColor: isSelected ? 'currentColor' : 'transparent',
                        }}
                      >
                        {isSelected && <Check className="w-3 h-3" style={{ color: `hsl(${ds.cardColor})` }} />}
                      </div>
                      <span className="font-medium pointer-events-none">{option.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Mascot bottom */}
            {mascotSettings?.rivePosition === 'bottom' && renderMascot()}
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
            const accentColor = designSystem?.designBlock?.accentElementColor || ds.primaryColor;
            borderColor = `hsl(${accentColor})`;
            bgColor = `hsl(${accentColor} / 0.1)`;
            textColor = `hsl(${accentColor})`;
          }
          
          return { borderColor, backgroundColor: bgColor, color: textColor, borderRadius: ds.borderRadius };
        };
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-0 h-full min-h-0">
            {/* Mascot top */}
            {mascotSettings?.rivePosition === 'top' && renderMascot()}
            <div className="w-full flex-1 flex flex-col justify-center">
              <p
                className="text-lg font-semibold mb-6 text-center"
                style={{ color: `hsl(${ds.foregroundColor})` }}
              >
                {block.content || 'Утверждение верно?'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (answerState !== 'idle') return;
                    setTrueFalseAnswer(true);
                  }}
                  disabled={answerState !== 'idle'}
                  className="p-4 flex flex-col items-center gap-2 border-2 transition-all cursor-pointer"
                  style={getTFButtonStyle(true)}
                >
                  <Check className="w-8 h-8" />
                  <span className="font-semibold">Да</span>
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (answerState !== 'idle') return;
                    setTrueFalseAnswer(false);
                  }}
                  disabled={answerState !== 'idle'}
                  className="p-4 flex flex-col items-center gap-2 border-2 transition-all cursor-pointer"
                  style={getTFButtonStyle(false)}
                >
                  <X className="w-8 h-8" />
                  <span className="font-semibold">Нет</span>
                </button>
              </div>
            </div>
            {/* Mascot bottom */}
            {mascotSettings?.rivePosition === 'bottom' && renderMascot()}
          </div>
        );

      case 'fill_blank':
        const parts = (block.content || 'Вставьте ___ слово').split('___');
        const showFBResult = answerState !== 'idle';
        const isCorrectFB = fillBlankInput.toLowerCase().trim() === (block.blankWord || '').toLowerCase().trim();
        const accentColorFB = designSystem?.designBlock?.accentElementColor || ds.primaryColor;
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            {/* Mascot top */}
            {mascotSettings?.rivePosition === 'top' && renderMascot()}
            <p className="text-lg text-center" style={{ color: `hsl(${ds.foregroundColor})` }}>
              {parts[0]}
              <span 
                className="inline-block mx-1 px-4 py-1 border-b-2 rounded-full font-medium min-w-[80px]"
                style={{
                  backgroundColor: showFBResult 
                    ? (isCorrectFB ? `hsl(${ds.successColor} / 0.1)` : `hsl(${ds.destructiveColor} / 0.1)`)
                    : `hsl(${accentColorFB} / 0.15)`,
                  borderColor: showFBResult 
                    ? (isCorrectFB ? `hsl(${ds.successColor})` : `hsl(${ds.destructiveColor})`)
                    : `hsl(${accentColorFB})`,
                  color: showFBResult 
                    ? (isCorrectFB ? `hsl(${ds.successColor})` : `hsl(${ds.destructiveColor})`)
                    : `hsl(${accentColorFB})`,
                }}
              >
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
              className="w-full max-w-[200px] px-4 py-2 rounded-full border-2 text-center focus:outline-none disabled:opacity-50"
              style={{
                borderColor: `hsl(${accentColorFB})`,
                backgroundColor: `hsl(${ds.cardColor})`,
                color: `hsl(${ds.foregroundColor})`,
              }}
            />
            {showFBResult && !isCorrectFB && (
              <p className="text-sm" style={{ color: `hsl(${ds.mutedColor})` }}>
                Правильный ответ: <span style={{ color: `hsl(${ds.successColor})` }} className="font-medium">{block.blankWord}</span>
              </p>
            )}
            {/* Mascot bottom */}
            {mascotSettings?.rivePosition === 'bottom' && renderMascot()}
          </div>
        );

      case 'slider':
        const showSliderResult = answerState !== 'idle';
        const hasRange = block.sliderCorrectMax !== undefined;
        const isSliderCorrect = hasRange 
          ? (sliderValue >= (block.sliderCorrect || 0) && sliderValue <= (block.sliderCorrectMax || 100))
          : Math.abs(sliderValue - (block.sliderCorrect || 50)) <= ((block.sliderMax || 100) - (block.sliderMin || 0)) * 0.05;
        
        const sliderPercent = ((sliderValue - (block.sliderMin || 0)) / ((block.sliderMax || 100) - (block.sliderMin || 0))) * 100;
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 h-full min-h-0">
            {/* Mascot top */}
            {mascotSettings?.rivePosition === 'top' && renderMascot()}
            <p
              className="text-lg font-semibold text-center"
              style={{ color: `hsl(${ds.foregroundColor})` }}
            >
              {block.content || 'Выберите значение'}
            </p>
            
            <div className="w-full max-w-xs space-y-6">
              {/* Current value display */}
              <div 
                className={cn(
                  "text-5xl font-bold text-center transition-colors",
                  showSliderResult && isSliderCorrect && "text-success",
                  showSliderResult && !isSliderCorrect && "text-destructive",
                  !showSliderResult && "text-primary"
                )}
              >
                {sliderValue}
              </div>
              
              {/* Custom styled slider */}
              <div className="relative h-7 flex items-center">
                {/* Track background */}
                <div 
                  className="absolute left-0 right-0 h-3 rounded-full"
                  style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
                />
                {/* Track progress */}
                <div 
                  className="absolute left-0 h-3 rounded-full"
                  style={{ 
                    width: `${sliderPercent}%`,
                    backgroundColor: showSliderResult 
                      ? (isSliderCorrect ? `hsl(${ds.successColor})` : `hsl(${ds.destructiveColor})`)
                      : `hsl(${(designSystem?.designBlock as any)?.sliderTrackColor || accentColor})`
                  }}
                />
                {/* Thumb */}
                <div 
                  className="absolute w-7 h-7 rounded-full shadow-lg border-4 border-white -translate-x-1/2 pointer-events-none"
                  style={{ 
                    left: `${sliderPercent}%`,
                    backgroundColor: showSliderResult 
                      ? (isSliderCorrect ? `hsl(${ds.successColor})` : `hsl(${ds.destructiveColor})`)
                      : `hsl(${(designSystem?.designBlock as any)?.sliderThumbColor || accentColor})`
                  }}
                />
                {/* Invisible input */}
                <input
                  type="range"
                  min={block.sliderMin || 0}
                  max={block.sliderMax || 100}
                  step={block.sliderStep || 1}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  disabled={answerState !== 'idle'}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
              
              {/* Min/Max labels */}
              <div 
                className="flex justify-between text-sm mt-3"
                style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }}
              >
                <span>{block.sliderMin || 0}</span>
                <span>{block.sliderMax || 100}</span>
              </div>
            </div>
            
            {showSliderResult && !isSliderCorrect && (
              <p className="text-sm" style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}>
                Правильный ответ: <span className="text-success font-bold">
                  {hasRange ? `${block.sliderCorrect} - ${block.sliderCorrectMax}` : block.sliderCorrect}
                </span>
              </p>
            )}
            {/* Mascot bottom */}
            {mascotSettings?.rivePosition === 'bottom' && renderMascot()}
          </div>
        );

      case 'matching':
        const showMatchResult = answerState !== 'idle';
        // Use shuffled rights from state
        const availableRights = shuffledRights.filter(r => !Object.values(matchingSelected.pairs).includes(r));
        
        // Get matching colors from design system
        const matchingBg = (designSystem?.designBlock as any)?.matchingItemBgColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingItemBgColor;
        const matchingBorder = (designSystem?.designBlock as any)?.matchingItemBorderColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingItemBorderColor;
        const matchingCorrect = (designSystem?.designBlock as any)?.matchingCorrectColor || ds.successColor;
        const matchingIncorrect = (designSystem?.designBlock as any)?.matchingIncorrectColor || ds.destructiveColor;
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto h-full min-h-0">
            {/* Mascot top */}
            {mascotSettings?.rivePosition === 'top' && renderMascot()}
            <div className="w-full flex-1 flex flex-col justify-center">
              <p 
                className="text-lg font-semibold mb-4 text-center"
                style={{ color: `hsl(${ds.foregroundColor})`, fontFamily: ds.headingFontFamily }}
              >
                {block.content || 'Соедините пары'}
              </p>
              <div className="space-y-2">
                {(block.matchingPairs || []).map((pair) => {
                  const selectedRight = matchingSelected.pairs[pair.left];
                  const isCorrectPair = selectedRight === pair.right;
                  const isSelected = matchingSelected.left === pair.left;
                  
                  let leftBorderColor = `hsl(${matchingBorder})`;
                  let leftBgColor = `hsl(${matchingBg})`;
                  let leftTextColor = `hsl(${ds.foregroundColor})`;
                  
                  if (showMatchResult && isCorrectPair) {
                    leftBorderColor = `hsl(${matchingCorrect})`;
                    leftBgColor = `hsl(${matchingCorrect} / 0.15)`;
                    leftTextColor = `hsl(${matchingCorrect})`;
                  } else if (showMatchResult && selectedRight && !isCorrectPair) {
                    leftBorderColor = `hsl(${matchingIncorrect})`;
                    leftBgColor = `hsl(${matchingIncorrect} / 0.15)`;
                    leftTextColor = `hsl(${matchingIncorrect})`;
                  } else if (isSelected) {
                    leftBorderColor = `hsl(${accentColor})`;
                    leftBgColor = `hsl(${accentColor} / 0.1)`;
                    leftTextColor = `hsl(${accentColor})`;
                  }
                  
                  return (
                    <div key={pair.id} className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (answerState !== 'idle') return;
                          setMatchingSelected(prev => ({ ...prev, left: pair.left }));
                        }}
                        className="flex-1 p-2.5 text-xs font-medium transition-all border-2"
                        style={{
                          borderColor: leftBorderColor,
                          backgroundColor: leftBgColor,
                          color: leftTextColor,
                          borderRadius: ds.borderRadius,
                        }}
                      >
                        {pair.left}
                      </button>
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: `hsl(${accentColor})` }} />
                      <div 
                        className="flex-1 p-2.5 text-xs font-medium min-h-[36px] flex items-center justify-center border-2"
                        style={{
                          borderRadius: ds.borderRadius,
                          borderColor: selectedRight 
                            ? (showMatchResult 
                                ? (isCorrectPair ? `hsl(${matchingCorrect})` : `hsl(${matchingIncorrect})`)
                                : `hsl(${accentColor})`)
                            : `hsl(${matchingBorder})`,
                          borderStyle: selectedRight ? 'solid' : 'dashed',
                          backgroundColor: selectedRight 
                            ? (showMatchResult 
                                ? (isCorrectPair ? `hsl(${matchingCorrect} / 0.15)` : `hsl(${matchingIncorrect} / 0.15)`)
                                : `hsl(${accentColor} / 0.1)`)
                            : `hsl(${matchingBg} / 0.5)`,
                          color: selectedRight 
                            ? (showMatchResult 
                                ? (isCorrectPair ? `hsl(${matchingCorrect})` : `hsl(${matchingIncorrect})`)
                                : `hsl(${accentColor})`)
                            : `hsl(${ds.foregroundColor} / 0.5)`,
                        }}
                      >
                        {selectedRight || '?'}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {matchingSelected.left && !showMatchResult && (
                <div 
                  className="mt-4 p-3 rounded-xl"
                  style={{ backgroundColor: `hsl(${ds.mutedColor} / 0.3)` }}
                >
                  <p className="text-xs mb-2" style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}>
                    Выберите пару для: <span style={{ color: `hsl(${accentColor})`, fontWeight: 500 }}>{matchingSelected.left}</span>
                  </p>
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
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: `hsl(${accentColor} / 0.1)`,
                          color: `hsl(${accentColor})`,
                        }}
                      >
                        {right}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Mascot bottom */}
            {mascotSettings?.rivePosition === 'bottom' && renderMascot()}
          </div>
        );

      case 'ordering':
        const showOrderResult = answerState !== 'idle';
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto h-full min-h-0">
            {/* Mascot top */}
            {mascotSettings?.rivePosition === 'top' && renderMascot()}
            <div className="w-full flex-1 flex flex-col justify-center">
              <p className="text-lg font-semibold mb-4 text-center" style={{ color: `hsl(${ds.foregroundColor})` }}>
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
                      <span className="text-sm flex-1" style={{ color: `hsl(${ds.foregroundColor})` }}>{item}</span>
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
            {/* Mascot bottom */}
            {mascotSettings?.rivePosition === 'bottom' && renderMascot()}
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

  // Get accent color from design system for progress bar and quiz selections
  const accentColor = (designSystem?.designBlock as { accentElementColor?: string })?.accentElementColor || DEFAULT_DESIGN_BLOCK_SETTINGS.accentElementColor;
  const inactiveColor = '0 0% 0% / 0.15'; // Light gray for inactive elements
  

  const progressBarStyle = designSystem?.progressBarStyle || 'dots';

  const renderProgressBar = () => {
    const displayBlocks = Math.min(totalBlocks, 20);
    const progress = totalBlocks > 0 ? ((blockIndex + 1) / totalBlocks) * 100 : 0;
    
    // Bar style - square solid line
    if (progressBarStyle === 'bar') {
      return (
        <div 
          className="w-full h-1"
          style={{ backgroundColor: `hsl(${inactiveColor})` }}
        >
          <div 
            className="h-full transition-all"
            style={{ 
              width: `${progress}%`,
              backgroundColor: `hsl(${accentColor})` 
            }}
          />
        </div>
      );
    }
    
    // Bar-rounded or line style - rounded solid line
    if (progressBarStyle === 'bar-rounded' || progressBarStyle === 'line') {
      return (
        <div 
          className="w-[95%] h-1.5 rounded-full overflow-hidden mx-auto"
          style={{ backgroundColor: `hsl(${inactiveColor})` }}
        >
          <div 
            className="h-full rounded-full transition-all"
            style={{ 
              width: `${progress}%`,
              backgroundColor: `hsl(${accentColor})` 
            }}
          />
        </div>
      );
    }

    // Pills style - rounded segments
    if (progressBarStyle === 'pills') {
      return (
        <>
          {Array.from({ length: displayBlocks }).map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-sm transition-all"
              style={{
                width: '16px',
                backgroundColor: i <= blockIndex 
                  ? `hsl(${accentColor})` 
                  : `hsl(${inactiveColor})`,
              }}
            />
          ))}
          {totalBlocks > 20 && (
            <span className="text-xs ml-1" style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}>
              +{totalBlocks - 20}
            </span>
          )}
        </>
      );
    }

    // Numbers style - "3/10" format
    if (progressBarStyle === 'numbers') {
      return (
        <span 
          className="text-sm font-semibold"
          style={{ color: `hsl(${ds.foregroundColor})` }}
        >
          <span style={{ color: `hsl(${accentColor})` }}>{blockIndex + 1}</span>
          <span className="opacity-50"> / {totalBlocks}</span>
        </span>
      );
    }

    // Default: dots style
    return (
      <>
        {Array.from({ length: displayBlocks }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              height: '6px',
              width: i === blockIndex ? '24px' : '8px',
              backgroundColor: i <= blockIndex 
                ? `hsl(${accentColor})` 
                : `hsl(${inactiveColor})`,
            }}
          />
        ))}
        {totalBlocks > 20 && (
          <span className="text-xs ml-1" style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}>
            +{totalBlocks - 20}
          </span>
        )}
      </>
    );
  };

  const progressBar = !hideHeader && (
    <div 
      className="h-10 flex items-center justify-center px-4 shrink-0 gap-1"
    >
      {renderProgressBar()}
    </div>
  );

  const contentArea = (
    <div 
      className="flex-1 min-h-0 overflow-auto relative z-0 flex flex-col justify-center"
      style={getBackgroundStyle(ds, block?.backgroundId)}
    >
      {renderContent()}
    </div>
  );

  // Derive feedback colors from design system using colorUtils
  // Correct answer colors - derived from successColor
  const correctBgTint = getSoftBackgroundColor(ds.successColor, 90);
  const correctTextColor = getDarkTextColor(ds.successColor);
  
  // Partial answer colors - derived from partialColor
  const partialColorDs = ds.partialColor || '35 92% 50%';
  const partialBgTint = getSoftBackgroundColor(partialColorDs, 90);
  const partialTextColor = getDarkTextColor(partialColorDs);
  
  // Incorrect answer colors - derived from destructiveColor
  const incorrectBgTint = getSoftBackgroundColor(ds.destructiveColor, 93);
  const incorrectTextColor = getDarkTextColor(ds.destructiveColor);

  const resultFeedback = answerState !== 'idle' && (
    <div 
      className="px-4 py-3 text-center text-sm font-medium shrink-0"
      style={{
        backgroundColor: answerState === 'correct' 
          ? correctBgTint 
          : answerState === 'partial'
            ? partialBgTint
            : incorrectBgTint,
        color: answerState === 'correct' 
          ? correctTextColor 
          : answerState === 'partial'
            ? partialTextColor
            : incorrectTextColor,
      }}
    >
      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="flex items-center justify-center gap-2">
          {answerState === 'correct' ? (
            <>
              <Check className="w-5 h-5" />
              <span className="text-base font-bold">Правильно!</span>
            </>
          ) : answerState === 'partial' ? (
            <>
              <Zap className="w-5 h-5" />
              <span className="text-base font-bold">Почти!</span>
            </>
          ) : (
            <>
              <X className="w-5 h-5" />
              <span className="text-base font-bold">Неправильно</span>
            </>
          )}
        </div>
        {answerState === 'correct' && (
          <span className="text-sm font-medium opacity-90 mt-1">
            {block?.type === 'multiple_choice' 
              ? (block?.explanation || 'Так держать!') 
              : (block?.explanationCorrect || block?.explanation || 'Так держать!')}
          </span>
        )}
        {answerState === 'partial' && (
          <span className="text-sm font-medium opacity-90 mt-1">Подумай ещё чуть-чуть</span>
        )}
        {answerState === 'incorrect' && (
          <span className="text-sm font-medium opacity-90 mt-1">{block?.explanation || 'Попробуй ещё раз'}</span>
        )}
      </div>
    </div>
  );

  // Hint display and button
  const hasHints = block?.hints && block.hints.length > 0;
  const currentHint = hasHints && shownHintIndex >= 0 ? block.hints[shownHintIndex] : null;
  const canShowNextHint = hasHints && shownHintIndex < (block?.hints?.length || 0) - 1;
  
  const hintDisplay = hasHints && shownHintIndex >= 0 && (
    <div 
      className="mx-4 mb-2 p-3 rounded-lg border-2 shrink-0"
      style={{
        backgroundColor: `hsl(${ds.hintBackgroundColor})`,
        borderColor: `hsl(${ds.hintBorderColor})`,
      }}
    >
      <div className="flex items-start gap-2">
        <AlertCircle 
          className="w-4 h-4 mt-0.5 shrink-0" 
          style={{ color: `hsl(${ds.hintIconColor})` }} 
        />
        <p 
          className="text-sm"
          style={{ color: `hsl(${ds.hintTextColor})` }}
        >
          {currentHint?.text}
        </p>
      </div>
      {shownHintIndex < (block?.hints?.length || 0) - 1 && (
        <p 
          className="text-xs mt-1 opacity-60"
          style={{ color: `hsl(${ds.hintTextColor})` }}
        >
          Подсказка {shownHintIndex + 1} из {block?.hints?.length}
        </p>
      )}
    </div>
  );

  const hintButton = hasHints && answerState === 'idle' && canShowNextHint && (
    <button
      type="button"
      onClick={() => setShownHintIndex(prev => prev + 1)}
      className="h-10 px-3 flex items-center gap-2 border-2 text-sm font-medium rounded-lg"
      style={{
        backgroundColor: `hsl(${ds.hintBackgroundColor})`,
        borderColor: `hsl(${ds.hintBorderColor})`,
        color: `hsl(${ds.hintTextColor})`,
      }}
    >
      <AlertCircle className="w-4 h-4" style={{ color: `hsl(${ds.hintIconColor})` }} />
      Подсказка
    </button>
  );

  const bottomNavigation = (
    <div 
      className="h-20 flex items-center justify-center gap-3 px-4 pb-2 shrink-0 relative z-10"
      style={{ 
        backgroundColor: answerState === 'correct' 
          ? correctBgTint 
          : answerState === 'partial'
            ? partialBgTint
            : answerState === 'incorrect'
              ? incorrectBgTint
              : 'transparent',
      }}
    >
      {/* Hint button - only when idle and has more hints */}
      {hintButton}
      
      {/* Show retry button only for partial answers */}
      {isInteractive && answerState === 'partial' && (
        <button
          type="button"
          onClick={resetState}
          className={cn(
            "h-11 px-4 flex items-center gap-2 border-2 font-bold uppercase tracking-wide",
            pressAnimationClass
          )}
          style={{
            borderColor: `hsl(${partialColorDs})`,
            backgroundColor: `hsl(0 0% 100%)`,
            color: `hsl(${partialColorDs})`,
            borderRadius: getButtonRadius(),
          }}
        >
          <RotateCcw className="w-4 h-4" />
          ЗАНОВО
        </button>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isInteractive && answerState === 'idle') {
            checkAnswer();
          } else {
            handleContinue();
          }
        }}
        className={cn(
          "flex-1 h-11 max-w-md font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]",
          pressAnimationClass
        )}
        disabled={isInteractive && answerState === 'idle' && !canCheck()}
        style={{
          // Use success color for correct, amber for partial, destructive for incorrect
          backgroundColor: answerState === 'correct' 
            ? `hsl(${ds.successColor})` 
            : answerState === 'partial'
              ? `hsl(${partialColorDs})`
              : answerState === 'incorrect'
                ? `hsl(${ds.destructiveColor})`
                : `hsl(${ds.primaryColor})`,
          color: answerState === 'correct' || answerState === 'partial' || answerState === 'incorrect'
            ? `hsl(0 0% 100%)` 
            : `hsl(${ds.primaryForeground})`,
          // Keep button shape from design system
          borderRadius: getButtonRadius(),
          ...(answerState === 'correct' 
            ? getRaisedButtonStyle(ds.successColor) 
            : answerState === 'partial'
              ? getRaisedButtonStyle(partialColorDs)
              : answerState === 'incorrect'
                ? getRaisedButtonStyle(ds.destructiveColor)
                : getRaisedButtonStyle(ds.primaryColor)),
        }}
      >
        {isInteractive && answerState === 'idle' 
          ? 'ПРОВЕРИТЬ' 
          : answerState === 'incorrect' 
            ? 'ПОНЯТНО' 
            : 'ДАЛЕЕ'}
      </button>
    </div>
  );

  // Embedded mode - fills parent container, used in CoursePlayer/PublicCourse
  // Uses same flex pattern as tested in LayoutTest
  if (embedded) {
    return (
      <div 
        ref={containerRef}
        className="h-full w-full flex flex-col"
        style={{ 
          fontFamily: ds.fontFamily,
          ...getBackgroundStyle(ds, block?.backgroundId),
        }}
      >
        {progressBar}
        {/* Content area - flex-1 to fill space, min-h-0 for scroll, centered */}
        <div 
          className="flex-1 min-h-0 overflow-auto flex flex-col justify-center items-center px-4 py-4"
        >
          {renderContent()}
        </div>
        {hintDisplay}
        {resultFeedback}
        {/* Bottom navigation - shrink-0 to stay fixed at bottom */}
        <div 
          className="h-20 flex items-center justify-center gap-3 px-4 shrink-0"
          style={{ 
            backgroundColor: answerState === 'correct' 
              ? correctBgTint 
              : answerState === 'partial'
                ? partialBgTint
                : answerState === 'incorrect'
                  ? incorrectBgTint
                  : 'transparent',
          }}
        >
          {/* Hint button - only when idle and has more hints */}
          {hintButton}
          
          {/* Show retry button only for partial answers */}
          {isInteractive && answerState === 'partial' && (
            <button
              type="button"
              onClick={resetState}
              className={cn(
                "h-11 px-4 flex items-center gap-2 border-2 font-bold uppercase tracking-wide",
                pressAnimationClass
              )}
              style={{
                borderColor: `hsl(${partialColorDs})`,
                backgroundColor: `hsl(0 0% 100%)`,
                color: `hsl(${partialColorDs})`,
                borderRadius: getButtonRadius(),
              }}
            >
              <RotateCcw className="w-4 h-4" />
              ЗАНОВО
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isInteractive && answerState === 'idle') {
                checkAnswer();
              } else {
                handleContinue();
              }
            }}
            className={cn(
              "flex-1 h-11 max-w-md font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed",
              pressAnimationClass
            )}
            disabled={isInteractive && answerState === 'idle' && !canCheck()}
            style={{
              backgroundColor: answerState === 'correct' 
                ? `hsl(${ds.successColor})` 
                : answerState === 'partial'
                  ? `hsl(${partialColorDs})`
                  : answerState === 'incorrect'
                    ? `hsl(${ds.destructiveColor})`
                    : `hsl(${ds.primaryColor})`,
              color: answerState === 'correct' || answerState === 'partial' || answerState === 'incorrect'
                ? `hsl(0 0% 100%)` 
                : `hsl(${ds.primaryForeground})`,
              borderRadius: getButtonRadius(),
              ...(answerState === 'correct' 
                ? getRaisedButtonStyle(ds.successColor) 
                : answerState === 'partial'
                  ? getRaisedButtonStyle(partialColorDs)
                  : answerState === 'incorrect'
                    ? getRaisedButtonStyle(ds.destructiveColor)
                    : getRaisedButtonStyle(ds.primaryColor)),
            }}
          >
            {isInteractive && answerState === 'idle' 
              ? 'ПРОВЕРИТЬ' 
              : answerState === 'incorrect' 
                ? 'ПОНЯТНО' 
                : 'ДАЛЕЕ'}
          </button>
        </div>
      </div>
    );
  }

  // fillContainer mode - fills parent 100% without zoom, for fullscreen/public view
  // Uses absolute positioning to ensure button is always at bottom
  if (fillContainer) {
    const NAV_HEIGHT = 80; // h-20 = 80px
    const HEADER_HEIGHT = hideHeader ? 0 : 40; // h-10 = 40px
    
    return (
      <div 
        className="relative h-full w-full overflow-hidden"
        style={{ 
          fontFamily: ds.fontFamily,
          ...getBackgroundStyle(ds, block?.backgroundId),
        }}
      >
        {/* Header/progress bar - absolute at top */}
        {!hideHeader && (
          <div 
            className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center px-4 border-b z-10"
            style={{ 
              backgroundColor: `hsl(0 0% 0% / 0.03)`,
              borderColor: `hsl(${ds.mutedColor})`,
            }}
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalBlocks, 20) }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    height: '6px',
                    width: i === blockIndex ? '24px' : '8px',
                    backgroundColor: i <= blockIndex 
                      ? `hsl(${accentColor})` 
                      : `hsl(${inactiveColor})`,
                  }}
                />
              ))}
              {totalBlocks > 20 && (
                <span className="text-xs ml-1" style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}>
                  +{totalBlocks - 20}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Content area - absolute positioned between header and nav, centered */}
        <div 
          className="absolute left-0 right-0 overflow-auto flex flex-col justify-center items-center px-4 py-4"
          style={{ 
            top: `${HEADER_HEIGHT}px`,
            bottom: `${NAV_HEIGHT}px`,
          }}
        >
          {renderContent()}
        </div>
        
        {/* Result feedback - above bottom nav */}
        {answerState !== 'idle' && (
          <div 
            className="absolute left-0 right-0 px-4 py-3 text-center text-sm font-medium z-20"
            style={{
              bottom: `${NAV_HEIGHT}px`,
              backgroundColor: answerState === 'correct' 
                ? correctBgTint 
                : answerState === 'partial'
                  ? partialBgTint
                  : incorrectBgTint,
              color: answerState === 'correct' 
                ? correctTextColor 
                : answerState === 'partial'
                  ? partialTextColor
                  : incorrectTextColor,
            }}
          >
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="flex items-center justify-center gap-2">
                {answerState === 'correct' ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span className="text-base font-bold">Правильно!</span>
                  </>
                ) : answerState === 'partial' ? (
                  <>
                    <Zap className="w-5 h-5" />
                    <span className="text-base font-bold">Почти!</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5" />
                    <span className="text-base font-bold">Неправильно</span>
                  </>
                )}
              </div>
              {answerState === 'correct' && (
                <span className="text-sm font-medium opacity-90 mt-1">
                  {block?.type === 'multiple_choice' 
                    ? (block?.explanation || 'Так держать!') 
                    : (block?.explanationCorrect || block?.explanation || 'Так держать!')}
                </span>
              )}
              {answerState === 'partial' && (
                <span className="text-sm font-medium opacity-90 mt-1">Подумай ещё чуть-чуть</span>
              )}
              {answerState === 'incorrect' && (
                <span className="text-sm font-medium opacity-90 mt-1">{block?.explanation || 'Попробуй ещё раз'}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Bottom nav - absolute at bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-center gap-3 px-4 z-10"
          style={{ 
            backgroundColor: answerState === 'correct' 
              ? correctBgTint 
              : answerState === 'partial'
                ? partialBgTint
                : answerState === 'incorrect'
                  ? incorrectBgTint
                  : 'transparent',
          }}
        >
          {/* Show retry button only for incorrect/partial answers */}
          {isInteractive && answerState !== 'idle' && answerState !== 'correct' && (
            <button
              type="button"
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
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isInteractive && answerState === 'idle') {
                checkAnswer();
              } else {
                handleContinue();
              }
            }}
            className={cn(
              "flex-1 h-11 max-w-md font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed",
              pressAnimationClass
            )}
            disabled={isInteractive && answerState === 'idle' && !canCheck()}
            style={{
              backgroundColor: answerState === 'correct' 
                ? `hsl(${ds.successColor})` 
                : answerState === 'partial'
                  ? `hsl(${partialColorDs})`
                  : answerState === 'incorrect'
                    ? `hsl(${ds.destructiveColor})`
                    : `hsl(${ds.primaryColor})`,
              color: answerState === 'correct' || answerState === 'partial' || answerState === 'incorrect'
                ? `hsl(0 0% 100%)` 
                : `hsl(${ds.primaryForeground})`,
              borderRadius: getButtonRadius(),
              ...(answerState === 'correct' 
                ? getRaisedButtonStyle(ds.successColor) 
                : answerState === 'partial'
                  ? getRaisedButtonStyle(partialColorDs)
                  : answerState === 'incorrect'
                    ? getRaisedButtonStyle(ds.destructiveColor)
                    : getRaisedButtonStyle(ds.primaryColor)),
            }}
          >
            {isInteractive && answerState === 'idle' 
              ? 'ПРОВЕРИТЬ' 
              : answerState === 'incorrect' 
                ? 'ПОНЯТНО' 
                : 'ДАЛЕЕ'}
          </button>
        </div>
      </div>
    );
  }

  // Normal mode with phone frame styling and scaling
  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-hidden flex items-center justify-center"
    >
      {/* Inner container with fixed dimensions, scaled to fit using CSS zoom for crisp rendering */}
      <div 
        className="flex flex-col overflow-hidden"
        style={{ 
          fontFamily: ds.fontFamily,
          // Fixed internal dimensions (mobile screen size)
          width: `${PREVIEW_BASE_WIDTH}px`,
          height: `${PREVIEW_BASE_HEIGHT}px`,
          // Use CSS zoom for proper layout sizing
          zoom: previewScale,
          ...getBackgroundStyle(ds, block?.backgroundId),
        }}
      >
        {progressBar}
        {contentArea}
        {hintDisplay}
        {resultFeedback}
        {bottomNavigation}
      </div>
    </div>
  );
};
