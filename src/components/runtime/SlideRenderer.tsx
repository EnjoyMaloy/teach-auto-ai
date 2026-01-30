/**
 * SlideRenderer - рендерит один слайд с полной интерактивностью
 * Единственный компонент для отображения слайда
 * Используется и в редакторе, и в публичной версии
 */

import React, { useState, useEffect } from 'react';
import { Slide, CourseDesignSystem } from '@/types/course';
import { cn } from '@/lib/utils';
import { Play, Volume2, Check, X } from 'lucide-react';
import { AudioPlayer } from '@/components/editor/blocks/AudioPlayer';
import { DesignBlockEditor } from '@/components/editor/blocks/DesignBlockEditor';
import { playSound, SoundConfig } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS, DEFAULT_DESIGN_BLOCK_SETTINGS } from '@/types/designSystem';
import { RiveMascot } from './RiveMascot';
import { getSoftBackgroundColor, getDarkTextColor, getButtonShadowColor } from '@/lib/colorUtils';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface SlideRendererProps {
  slide: Slide | null;
  designSystem?: CourseDesignSystem;
  onContinue?: () => void;
  isMuted?: boolean;
  showProgress?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

type AnswerState = 'idle' | 'correct' | 'incorrect' | 'partial';

// Дефолтные значения дизайн-системы
const DEFAULT_DS: {
  primaryColor: string;
  primaryForeground: string;
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  mutedColor: string;
  successColor: string;
  partialColor: string;
  destructiveColor: string;
  fontFamily: string;
  headingFontFamily: string;
  borderRadius: string;
  buttonStyle: 'rounded' | 'pill' | 'square';
  buttonDepth: 'flat' | 'raised';
  backgroundType: 'solid' | 'gradient';
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  hintBackgroundColor: string;
  hintBorderColor: string;
  hintTextColor: string;
  hintIconColor: string;
} = {
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
  buttonStyle: 'rounded',
  buttonDepth: 'raised',
  backgroundType: 'solid',
  gradientFrom: '262 83% 95%',
  gradientTo: '200 83% 95%',
  gradientAngle: 135,
  hintBackgroundColor: '240 5% 96%',
  hintBorderColor: '240 5% 90%',
  hintTextColor: '240 10% 30%',
  hintIconColor: '262 83% 58%',
};

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  designSystem,
  onContinue,
  isMuted = false,
  showProgress = true,
  currentIndex = 0,
  totalCount = 1,
}) => {
  // Мержим дизайн-систему с дефолтами
  const ds = { ...DEFAULT_DS, ...designSystem };
  
  // Звуковые настройки
  const soundConfig: SoundConfig = {
    enabled: !isMuted && (designSystem?.sound?.enabled !== false),
    theme: designSystem?.sound?.theme ?? DEFAULT_SOUND_SETTINGS.theme,
    volume: designSystem?.sound?.volume ?? DEFAULT_SOUND_SETTINGS.volume,
  };

  // Состояние для интерактивных блоков
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(50);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [matchingSelected, setMatchingSelected] = useState<{ 
    leftId: string | null; 
    rightId: string | null;
    matchedPairs: Array<{ leftId: string; rightId: string; isCorrect: boolean }>;
    flashingWrong: { leftId: string; rightId: string } | null;
  }>({ leftId: null, rightId: null, matchedPairs: [], flashingWrong: null });
  const [shuffledRights, setShuffledRights] = useState<Array<{ id: string; text: string }>>([]);
  const [orderingItems, setOrderingItems] = useState<Array<{ id: string; text: string }>>([]);
  const [orderedSequence, setOrderedSequence] = useState<string[]>([]); // IDs in selected order

  // Сброс состояния при смене слайда
  useEffect(() => {
    console.log('[SlideRenderer] Slide changed:', slide?.id, slide?.type);
    setSelectedOptions([]);
    setTrueFalseAnswer(null);
    setSliderValue(slide?.sliderMin || 0);
    setFillBlankInput('');
    setAnswerState('idle');
    setMatchingSelected({ leftId: null, rightId: null, matchedPairs: [], flashingWrong: null });
    
    if (slide?.matchingPairs) {
      // Shuffle right side items with their IDs
      const rights = slide.matchingPairs.map(p => ({ id: p.id, text: p.right }));
      setShuffledRights([...rights].sort(() => Math.random() - 0.5));
    }
    if (slide?.orderingItems) {
      // Create items with IDs and shuffle
      const items = slide.orderingItems.map((text, idx) => ({ id: `order-${idx}`, text }));
      setOrderingItems([...items].sort(() => Math.random() - 0.5));
      setOrderedSequence([]);
    }
  }, [slide?.id]);

  // Проверка ответа
  const checkAnswer = () => {
    if (!slide) return;

    let isCorrect = false;

    switch (slide.type) {
      case 'single_choice': {
        const correctOption = slide.options?.find(o => o.isCorrect);
        isCorrect = selectedOptions.length === 1 && selectedOptions[0] === correctOption?.id;
        break;
      }
      case 'multiple_choice': {
        const correctIds = slide.options?.filter(o => o.isCorrect).map(o => o.id) || [];
        const allCorrectSelected = correctIds.every(id => selectedOptions.includes(id));
        const noIncorrectSelected = selectedOptions.every(id => correctIds.includes(id));
        
        if (allCorrectSelected && noIncorrectSelected) {
          isCorrect = true;
        } else if (noIncorrectSelected && selectedOptions.length > 0 && selectedOptions.length < correctIds.length) {
          setAnswerState('partial');
          playSound('incorrect', soundConfig);
          return;
        }
        break;
      }
      case 'true_false':
        isCorrect = trueFalseAnswer === slide.correctAnswer;
        break;
      case 'fill_blank':
        isCorrect = fillBlankInput.toLowerCase().trim() === (slide.blankWord || '').toLowerCase().trim();
        break;
      case 'slider': {
        const tolerance = ((slide.sliderMax || 100) - (slide.sliderMin || 0)) * 0.05;
        isCorrect = Math.abs(sliderValue - (slide.sliderCorrect || 50)) <= tolerance;
        break;
      }
      case 'matching': {
        // All pairs must be matched and all must be correct
        const allMatched = matchingSelected.matchedPairs.length === (slide.matchingPairs?.length || 0);
        const allCorrect = matchingSelected.matchedPairs.every(mp => mp.isCorrect);
        isCorrect = allMatched && allCorrect;
        break;
      }
      case 'ordering': {
        // Check if ordered sequence matches correct order
        const orderedTexts = orderedSequence.map(id => orderingItems.find(item => item.id === id)?.text);
        isCorrect = JSON.stringify(orderedTexts) === JSON.stringify(slide.orderingItems);
        break;
      }
    }

    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect ? 'correct' : 'incorrect', soundConfig);
  };

  // Можно ли проверить ответ
  const canCheck = (): boolean => {
    if (!slide) return false;
    
    switch (slide.type) {
      case 'single_choice':
      case 'multiple_choice':
        return selectedOptions.length > 0;
      case 'true_false':
        return trueFalseAnswer !== null;
      case 'fill_blank':
        return fillBlankInput.trim().length > 0;
      case 'slider':
        return true;
      case 'matching':
        // Can check only when all pairs are matched
        return matchingSelected.matchedPairs.length === (slide.matchingPairs?.length || 0);
      case 'ordering':
        // Can check when all items are ordered
        return orderedSequence.length === orderingItems.length;
      default:
        return false;
    }
  };

  // Кнопки
  const isRaised = ds.buttonDepth !== 'flat';
  const getButtonRadius = () => {
    if (ds.buttonStyle === 'pill') return '9999px';
    if (ds.buttonStyle === 'square') return '0';
    return ds.borderRadius;
  };

  const getRaisedButtonStyle = (baseColor: string) => {
    if (!isRaised) return {};
    // Use derived shadow color for proper 3D effect
    const shadowColor = getButtonShadowColor(baseColor);
    return {
      boxShadow: `0 4px 0 0 hsl(${shadowColor}), 0 6px 12px -2px hsl(${baseColor} / 0.25)`,
    };
  };

  const pressAnimationClass = isRaised ? 'btn-raised' : 'btn-flat';
  const isInteractive = ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'slider', 'matching', 'ordering'].includes(slide?.type || '');

  // Маскот настройки
  const mascotSettings = designSystem?.mascot;
  const showMascot = mascotSettings?.riveEnabled && mascotSettings?.riveUrl && isInteractive;
  const mascotState: 'idle' | 'correct' | 'incorrect' = 
    answerState === 'correct' ? 'correct' : 
    answerState === 'incorrect' ? 'incorrect' : 'idle';

  // Рендер маскота
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

  // Пустой слайд
  if (!slide) {
    return (
      <div 
        className="h-full w-full flex items-center justify-center"
        style={{ backgroundColor: `hsl(${ds.backgroundColor})` }}
      >
        <div className="text-center px-8">
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
          >
            <Play className="w-8 h-8" style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }} />
          </div>
          <p style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }} className="text-sm">
            Выберите блок
          </p>
        </div>
      </div>
    );
  }

  // Рендер контента в зависимости от типа
  const renderContent = () => {
    console.log('[SlideRenderer] Rendering slide type:', slide.type, 'subBlocks:', slide.subBlocks?.length);
    
    switch (slide.type) {
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
              {slide.content || 'Заголовок'}
            </h1>
          </div>
        );

      case 'text': {
        const textSizeClass = {
          small: 'text-sm',
          medium: 'text-base',
          large: 'text-xl',
          xlarge: 'text-2xl',
        }[slide.textSize || 'medium'];
        
        return (
          <div className="h-full flex items-center justify-center p-8">
            <p 
              className={cn('leading-relaxed text-center', textSizeClass)}
              style={{ color: `hsl(${ds.foregroundColor})` }}
            >
              {slide.content || 'Текст...'}
            </p>
          </div>
        );
      }

      case 'video': {
        const getYouTubeId = (url: string) => {
          if (!url) return null;
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url.match(regExp);
          return match && match[2].length === 11 ? match[2] : null;
        };
        
        const videoId = slide.videoUrl ? getYouTubeId(slide.videoUrl) : null;
        
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
            ) : slide.videoUrl ? (
              <video src={slide.videoUrl} controls className="w-full h-full object-contain" playsInline />
            ) : (
              <div className="flex flex-col items-center justify-center text-white/60">
                <Play className="w-16 h-16 mb-4" />
                <p className="text-sm">Видео не загружено</p>
              </div>
            )}
          </div>
        );
      }

      case 'audio':
        return slide.audioUrl ? (
          <AudioPlayer
            audioUrl={slide.audioUrl}
            audioName={slide.content}
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
            <p style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }}>Аудио не загружено</p>
          </div>
        );

      case 'image_text':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 h-full min-h-0">
            {slide.imageUrl && (
              <OptimizedImage 
                src={slide.imageUrl} 
                alt="" 
                className="w-full rounded-2xl object-contain max-h-[60%]" 
              />
            )}
            <p className="text-lg text-center" style={{ color: `hsl(${ds.foregroundColor})` }}>
              {slide.content || 'Описание...'}
            </p>
          </div>
        );

      case 'design':
        console.log('[SlideRenderer] Rendering design block with subBlocks:', slide.subBlocks);
        return (
          <DesignBlockEditor
            subBlocks={slide.subBlocks || []}
            onUpdateSubBlocks={undefined}
            designSystem={designSystem}
            isEditing={false}
          />
        );

      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto h-full min-h-0">
            {/* Маскот сверху */}
            {mascotSettings?.rivePosition === 'top' && renderMascot()}
            
            <div className="w-full flex-1 flex flex-col justify-center">
              <p 
                className="text-lg font-semibold mb-4 text-center"
                style={{ 
                  color: `hsl(${ds.foregroundColor})`,
                  fontFamily: ds.headingFontFamily,
                }}
              >
                {slide.content || 'Вопрос?'}
              </p>
              <div className="space-y-2">
                {(slide.options || []).map((option) => {
                  const isSelected = selectedOptions.includes(option.id);
                  const showResult = answerState !== 'idle';
                  
                  let borderColor = `hsl(${ds.mutedColor})`;
                  let bgColor = `hsl(${ds.cardColor})`;
                  let textColor = `hsl(${ds.foregroundColor})`;
                  
                  // For partial state, use the partial color from design system
                  const partialColor = ds.partialColor || '35 92% 50%';
                  const correctColor = answerState === 'partial' ? partialColor : ds.successColor;
                  const correctBgColor = answerState === 'partial' ? `${partialColor} / 0.15` : `${ds.successColor} / 0.1`;
                  
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
                      onClick={() => {
                        if (answerState !== 'idle') return;
                        if (slide.type === 'single_choice') {
                          setSelectedOptions([option.id]);
                        } else {
                          setSelectedOptions(prev => 
                            prev.includes(option.id) 
                              ? prev.filter(id => id !== option.id)
                              : [...prev, option.id]
                          );
                        }
                      }}
                      disabled={answerState !== 'idle'}
                      className="w-full p-3 text-left transition-all text-sm border-2"
                      style={{
                        borderColor,
                        backgroundColor: bgColor,
                        color: textColor,
                        borderRadius: ds.borderRadius,
                      }}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Маскот снизу */}
            {mascotSettings?.rivePosition === 'bottom' && renderMascot()}
          </div>
        );

      case 'true_false':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 h-full min-h-0">
            {/* Маскот сверху */}
            {mascotSettings?.rivePosition === 'top' && renderMascot()}
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <p 
                className="text-lg font-semibold mb-6 text-center"
                style={{ 
                  color: `hsl(${ds.foregroundColor})`,
                  fontFamily: ds.headingFontFamily,
                }}
              >
                {slide.content || 'Верно или неверно?'}
              </p>
              <div className="flex gap-4">
                {[true, false].map((value) => {
                  const isSelected = trueFalseAnswer === value;
                  const showResult = answerState !== 'idle';
                  const isCorrect = slide.correctAnswer === value;
                  
                  let borderColor = `hsl(${ds.mutedColor})`;
                  let bgColor = `hsl(${ds.cardColor})`;
                  
                  if (showResult && isCorrect) {
                    borderColor = `hsl(${ds.successColor})`;
                    bgColor = `hsl(${ds.successColor} / 0.1)`;
                  } else if (showResult && isSelected && !isCorrect) {
                    borderColor = `hsl(${ds.destructiveColor})`;
                    bgColor = `hsl(${ds.destructiveColor} / 0.1)`;
                  } else if (!showResult && isSelected) {
                    const accentColor = designSystem?.designBlock?.accentElementColor || ds.primaryColor;
                    borderColor = `hsl(${accentColor})`;
                    bgColor = `hsl(${accentColor} / 0.1)`;
                  }
                  
                  return (
                    <button
                      key={String(value)}
                      onClick={() => answerState === 'idle' && setTrueFalseAnswer(value)}
                      disabled={answerState !== 'idle'}
                      className="w-24 h-24 flex flex-col items-center justify-center border-2 transition-all"
                      style={{
                        borderColor,
                        backgroundColor: bgColor,
                        borderRadius: ds.borderRadius,
                      }}
                    >
                      {value ? (
                        <Check className="w-8 h-8" style={{ color: `hsl(${ds.successColor})` }} />
                      ) : (
                        <X className="w-8 h-8" style={{ color: `hsl(${ds.destructiveColor})` }} />
                      )}
                      <span className="text-sm mt-2" style={{ color: `hsl(${ds.foregroundColor})` }}>
                        {value ? 'Верно' : 'Неверно'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Маскот снизу */}
            {mascotSettings?.rivePosition === 'bottom' && renderMascot()}
          </div>
        );

      case 'fill_blank': {
        const parts = (slide.content || '').split('___');
        const fillUnderline = designSystem?.designBlock?.fillBlankUnderlineColor || DEFAULT_DESIGN_BLOCK_SETTINGS.fillBlankUnderlineColor;
        const fillText = designSystem?.designBlock?.fillBlankTextColor || DEFAULT_DESIGN_BLOCK_SETTINGS.fillBlankTextColor;
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 h-full min-h-0">
            <div className="text-center">
              <p className="text-lg mb-4" style={{ color: `hsl(${ds.foregroundColor})` }}>
                {parts[0]}
                <input
                  type="text"
                  value={fillBlankInput}
                  onChange={(e) => setFillBlankInput(e.target.value)}
                  disabled={answerState !== 'idle'}
                  className="mx-2 px-3 py-1 border-b-2 bg-transparent text-center w-32 outline-none"
                  style={{
                    borderColor: answerState === 'correct' 
                      ? `hsl(${ds.successColor})` 
                      : answerState === 'incorrect'
                        ? `hsl(${ds.destructiveColor})`
                        : `hsl(${fillUnderline})`,
                    color: `hsl(${fillText})`,
                  }}
                  placeholder="..."
                />
                {parts[1]}
              </p>
            </div>
          </div>
        );
      }

      case 'slider': {
        const sliderTrack = designSystem?.designBlock?.sliderTrackColor || DEFAULT_DESIGN_BLOCK_SETTINGS.sliderTrackColor;
        const sliderThumb = designSystem?.designBlock?.sliderThumbColor || DEFAULT_DESIGN_BLOCK_SETTINGS.sliderThumbColor;
        const sliderValue_ = designSystem?.designBlock?.sliderValueColor || DEFAULT_DESIGN_BLOCK_SETTINGS.sliderValueColor;
        const trackProgress = ((sliderValue - (slide.sliderMin || 0)) / ((slide.sliderMax || 100) - (slide.sliderMin || 0))) * 100;
        
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4 h-full min-h-0">
            <p 
              className="text-lg font-semibold mb-6 text-center"
              style={{ 
                color: `hsl(${ds.foregroundColor})`,
                fontFamily: ds.headingFontFamily,
              }}
            >
              {slide.content || 'Выберите значение'}
            </p>
            <div className="w-full max-w-xs">
              {/* Custom slider */}
              <div className="relative h-6 flex items-center">
                {/* Track background */}
                <div 
                  className="absolute left-0 right-0 h-2 rounded-full"
                  style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
                />
                {/* Track progress */}
                <div 
                  className="absolute left-0 h-2 rounded-full"
                  style={{ 
                    width: `${trackProgress}%`,
                    backgroundColor: `hsl(${sliderTrack})`,
                  }}
                />
                {/* Thumb */}
                <div
                  className="absolute w-6 h-6 rounded-full border-4 shadow-md -translate-x-1/2"
                  style={{
                    left: `${trackProgress}%`,
                    backgroundColor: `hsl(${ds.cardColor})`,
                    borderColor: `hsl(${sliderThumb})`,
                  }}
                />
                {/* Invisible input for interaction */}
                <input
                  type="range"
                  min={slide.sliderMin || 0}
                  max={slide.sliderMax || 100}
                  step={slide.sliderStep || 1}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  disabled={answerState !== 'idle'}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              {/* Min/Max labels */}
              <div className="flex justify-between text-sm mt-1" style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }}>
                <span>{slide.sliderMin || 0}</span>
                <span>{slide.sliderMax || 100}</span>
              </div>
              <div className="text-center mt-4">
                <span 
                  className="text-4xl font-bold"
                  style={{ color: `hsl(${sliderValue_})` }}
                >
                  {sliderValue}
                </span>
              </div>
            </div>
          </div>
        );
      }

      case 'matching': {
        // Duolingo-style matching: tap left, then right, instant feedback
        const handleLeftClick = (pairId: string) => {
          if (answerState !== 'idle') return;
          // Check if already matched
          if (matchingSelected.matchedPairs.some(mp => mp.leftId === pairId)) return;
          
          setMatchingSelected(prev => ({
            ...prev,
            leftId: prev.leftId === pairId ? null : pairId,
            rightId: null,
          }));
        };

        const handleRightClick = (rightItem: { id: string; text: string }) => {
          if (answerState !== 'idle' || !matchingSelected.leftId) return;
          // Check if already used
          if (matchingSelected.matchedPairs.some(mp => mp.rightId === rightItem.id)) return;

          const selectedLeftPair = slide.matchingPairs?.find(p => p.id === matchingSelected.leftId);
          if (!selectedLeftPair) return;

          const isCorrectMatch = selectedLeftPair.right === rightItem.text;

          if (isCorrectMatch) {
            // Correct match - add to matched pairs with green color
            playSound('correct', soundConfig);
            setMatchingSelected(prev => ({
              leftId: null,
              rightId: null,
              matchedPairs: [...prev.matchedPairs, { 
                leftId: matchingSelected.leftId!, 
                rightId: rightItem.id, 
                isCorrect: true 
              }],
              flashingWrong: null,
            }));
          } else {
            // Wrong match - flash red and reset selection
            playSound('incorrect', soundConfig);
            setMatchingSelected(prev => ({
              ...prev,
              flashingWrong: { leftId: matchingSelected.leftId!, rightId: rightItem.id },
            }));
            // Reset after animation
            setTimeout(() => {
              setMatchingSelected(prev => ({
                ...prev,
                leftId: null,
                rightId: null,
                flashingWrong: null,
              }));
            }, 600);
          }
        };

        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto h-full min-h-0">
            <p 
              className="text-lg font-semibold mb-4 text-center"
              style={{ 
                color: `hsl(${ds.foregroundColor})`,
                fontFamily: ds.headingFontFamily,
              }}
            >
              {slide.content || 'Соедините пары'}
            </p>
            <div className="flex gap-3">
              {/* Left column */}
              <div className="flex-1 space-y-2">
                {(slide.matchingPairs || []).map((pair) => {
                  const isSelected = matchingSelected.leftId === pair.id;
                  const matchedPair = matchingSelected.matchedPairs.find(mp => mp.leftId === pair.id);
                  const isMatched = !!matchedPair;
                  const isFlashingWrong = matchingSelected.flashingWrong?.leftId === pair.id;
                  
                  const matchingBg = designSystem?.designBlock?.matchingItemBgColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingItemBgColor;
                  const matchingBorder = designSystem?.designBlock?.matchingItemBorderColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingItemBorderColor;
                  const matchingCorrect = designSystem?.designBlock?.matchingCorrectColor || ds.successColor;
                  const matchingIncorrect = designSystem?.designBlock?.matchingIncorrectColor || ds.destructiveColor;
                  const accentColor = designSystem?.designBlock?.accentElementColor || ds.primaryColor;
                  
                  let borderColor = `hsl(${matchingBorder})`;
                  let bgColor = `hsl(${matchingBg})`;
                  
                  if (isMatched) {
                    borderColor = `hsl(${matchingCorrect})`;
                    bgColor = `hsl(${matchingCorrect} / 0.15)`;
                  } else if (isFlashingWrong) {
                    borderColor = `hsl(${matchingIncorrect})`;
                    bgColor = `hsl(${matchingIncorrect} / 0.15)`;
                  } else if (isSelected) {
                    borderColor = `hsl(${accentColor})`;
                    bgColor = `hsl(${accentColor} / 0.1)`;
                  }
                  
                  return (
                    <button
                      key={pair.id}
                      onClick={() => handleLeftClick(pair.id)}
                      disabled={answerState !== 'idle' || isMatched}
                      className={cn(
                        "w-full p-3 text-center border-2 transition-all text-sm font-medium",
                        isFlashingWrong && "animate-pulse"
                      )}
                      style={{
                        borderColor,
                        backgroundColor: bgColor,
                        borderRadius: ds.borderRadius,
                        color: isMatched ? `hsl(${ds.successColor})` : `hsl(${ds.foregroundColor})`,
                        opacity: isMatched ? 0.7 : 1,
                      }}
                    >
                      {pair.left}
                    </button>
                  );
                })}
              </div>
              {/* Right column */}
              <div className="flex-1 space-y-2">
                {shuffledRights.map((rightItem) => {
                  const matchedPair = matchingSelected.matchedPairs.find(mp => mp.rightId === rightItem.id);
                  const isMatched = !!matchedPair;
                  const isFlashingWrong = matchingSelected.flashingWrong?.rightId === rightItem.id;
                  const canClick = matchingSelected.leftId !== null && !isMatched;
                  
                  const matchingBg = designSystem?.designBlock?.matchingItemBgColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingItemBgColor;
                  const matchingBorder = designSystem?.designBlock?.matchingItemBorderColor || DEFAULT_DESIGN_BLOCK_SETTINGS.matchingItemBorderColor;
                  const matchingCorrect = designSystem?.designBlock?.matchingCorrectColor || ds.successColor;
                  const matchingIncorrect = designSystem?.designBlock?.matchingIncorrectColor || ds.destructiveColor;
                  
                  let borderColor = `hsl(${matchingBorder})`;
                  let bgColor = `hsl(${matchingBg})`;
                  
                  if (isMatched) {
                    borderColor = `hsl(${matchingCorrect})`;
                    bgColor = `hsl(${matchingCorrect} / 0.15)`;
                  } else if (isFlashingWrong) {
                    borderColor = `hsl(${matchingIncorrect})`;
                    bgColor = `hsl(${matchingIncorrect} / 0.15)`;
                  }
                  
                  return (
                    <button
                      key={rightItem.id}
                      onClick={() => handleRightClick(rightItem)}
                      disabled={answerState !== 'idle' || !canClick || isMatched}
                      className={cn(
                        "w-full p-3 text-center border-2 transition-all text-sm font-medium",
                        isFlashingWrong && "animate-pulse",
                        !canClick && !isMatched && "opacity-60"
                      )}
                      style={{
                        borderColor,
                        backgroundColor: bgColor,
                        borderRadius: ds.borderRadius,
                        color: isMatched ? `hsl(${matchingCorrect})` : `hsl(${ds.foregroundColor})`,
                        opacity: isMatched ? 0.7 : 1,
                      }}>
                      {rightItem.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'ordering': {
        // Tap-to-order: tap items in sequence to assign order numbers
        const handleItemClick = (itemId: string) => {
          if (answerState !== 'idle') return;
          
          // If already selected, remove it and all items after it
          const existingIndex = orderedSequence.indexOf(itemId);
          if (existingIndex !== -1) {
            setOrderedSequence(prev => prev.slice(0, existingIndex));
            return;
          }
          
          // Add to sequence
          setOrderedSequence(prev => [...prev, itemId]);
        };

        const orderingBg = designSystem?.designBlock?.orderingItemBgColor || DEFAULT_DESIGN_BLOCK_SETTINGS.orderingItemBgColor;
        const orderingBorder = designSystem?.designBlock?.orderingItemBorderColor || DEFAULT_DESIGN_BLOCK_SETTINGS.orderingItemBorderColor;
        const orderingBadge = designSystem?.designBlock?.orderingBadgeColor || DEFAULT_DESIGN_BLOCK_SETTINGS.orderingBadgeColor;
        
        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto h-full min-h-0">
            <p 
              className="text-lg font-semibold mb-2 text-center"
              style={{ 
                color: `hsl(${ds.foregroundColor})`,
                fontFamily: ds.headingFontFamily,
              }}
            >
              {slide.content || 'Расположите в правильном порядке'}
            </p>
            <p 
              className="text-sm mb-4 text-center"
              style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}
            >
              Нажимайте на элементы по порядку
            </p>
            <div className="space-y-2">
              {orderingItems.map((item) => {
                const orderIndex = orderedSequence.indexOf(item.id);
                const isOrdered = orderIndex !== -1;
                const orderNumber = orderIndex + 1;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    disabled={answerState !== 'idle'}
                    className="w-full flex items-center gap-3 p-3 border-2 transition-all text-left"
                    style={{
                      borderColor: isOrdered ? `hsl(${orderingBadge})` : `hsl(${orderingBorder})`,
                      backgroundColor: isOrdered ? `hsl(${orderingBadge} / 0.1)` : `hsl(${orderingBg})`,
                      borderRadius: ds.borderRadius,
                    }}
                  >
                    {/* Order number badge */}
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all"
                      style={{ 
                        backgroundColor: isOrdered ? `hsl(${orderingBadge})` : `hsl(${ds.mutedColor})`,
                        color: isOrdered ? `hsl(${ds.primaryForeground})` : `hsl(${ds.foregroundColor} / 0.4)`,
                      }}
                    >
                      {isOrdered ? orderNumber : '?'}
                    </span>
                    <span 
                      className="flex-1 font-medium"
                      style={{ color: `hsl(${ds.foregroundColor})` }}
                    >
                      {item.text}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Reset button */}
            {orderedSequence.length > 0 && answerState === 'idle' && (
              <button
                onClick={() => setOrderedSequence([])}
                className="mt-4 text-sm underline self-center"
                style={{ color: `hsl(${ds.foregroundColor} / 0.6)` }}
              >
                Сбросить
              </button>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <p style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }}>
              Неизвестный тип блока: {slide.type}
            </p>
          </div>
        );
    }
  };

  // Фидбек после ответа
  const renderFeedback = () => {
    if (answerState === 'idle') return null;
    
    // Use imported utility functions for deriving colors
    // Light background and dark text are derived from the main bright color
    
    // Solid pastel backgrounds based on configured colors
    // Each state uses its own color from design system
    const bgColor = answerState === 'correct' 
      ? getSoftBackgroundColor(ds.successColor, 90)
      : answerState === 'partial'
        ? getSoftBackgroundColor(ds.partialColor, 90)
        : getSoftBackgroundColor(ds.destructiveColor, 93);
    
    // Text color uses corresponding design system color (dark version for readability)
    const textColor = answerState === 'correct'
      ? getDarkTextColor(ds.successColor)
      : answerState === 'partial'
        ? getDarkTextColor(ds.partialColor)
        : getDarkTextColor(ds.destructiveColor);

    const title = answerState === 'correct' 
      ? 'Правильно!' 
      : answerState === 'partial' 
        ? 'Частично верно' 
        : 'Неправильно';

    // Для multiple_choice не показываем explanationCorrect - только explanation
    const explanation = answerState === 'correct'
      ? (slide?.type === 'multiple_choice' ? slide?.explanation : (slide?.explanationCorrect || slide?.explanation))
      : answerState === 'partial'
        ? slide?.explanationPartial || slide?.explanation
        : slide?.explanation;

    return (
      <div 
        className="px-4 py-3 border-t"
        style={{ 
          backgroundColor: bgColor,
          borderColor: textColor,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          {answerState === 'correct' ? (
            <Check className="w-5 h-5" style={{ color: textColor }} />
          ) : (
            <X className="w-5 h-5" style={{ color: textColor }} />
          )}
          <span className="font-semibold" style={{ color: textColor }}>{title}</span>
        </div>
        {explanation && (
          <p className="text-sm" style={{ color: textColor }}>{explanation}</p>
        )}
      </div>
    );
  };

  // Прогресс бар
  const progress = totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0;
  const progressBarStyle = designSystem?.progressBarStyle || 'bar';
  const accentColor = designSystem?.designBlock?.accentElementColor || ds.primaryColor;
  
  const renderProgressBar = () => {
    // Bar style - square solid line
    if (progressBarStyle === 'bar') {
      return (
        <div 
          className="h-1 w-full flex-shrink-0"
          style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
        >
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: `hsl(${accentColor})`,
            }}
          />
        </div>
      );
    }
    
    // Bar-rounded or line style - rounded solid line
    if (progressBarStyle === 'bar-rounded' || progressBarStyle === 'line') {
      return (
        <div 
          className="h-1.5 w-full flex-shrink-0 rounded-full overflow-hidden mx-auto max-w-[95%] mt-1"
          style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
        >
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: `hsl(${accentColor})`,
            }}
          />
        </div>
      );
    }
    
    // Pills style - segments
    if (progressBarStyle === 'pills') {
      return (
        <div className="flex items-center justify-center gap-1 py-1 flex-shrink-0">
          {Array.from({ length: totalCount }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-sm transition-all flex-1 max-w-8"
              style={{
                backgroundColor: i <= currentIndex 
                  ? `hsl(${accentColor})` 
                  : `hsl(${ds.mutedColor})`,
              }}
            />
          ))}
        </div>
      );
    }
    
    // Numbers style
    if (progressBarStyle === 'numbers') {
      return (
        <div className="flex items-center justify-center py-1 flex-shrink-0">
          <span 
            className="text-sm font-semibold"
            style={{ color: `hsl(${ds.foregroundColor})` }}
          >
            <span style={{ color: `hsl(${accentColor})` }}>{currentIndex + 1}</span>
            <span className="opacity-50"> / {totalCount}</span>
          </span>
        </div>
      );
    }
    
    // Default: dots style
    return (
      <div className="flex items-center justify-center gap-1 py-1 flex-shrink-0">
        {Array.from({ length: totalCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              height: '6px',
              width: i === currentIndex ? '20px' : '6px',
              backgroundColor: i <= currentIndex 
                ? `hsl(${accentColor})` 
                : `hsl(${ds.mutedColor})`,
            }}
          />
        ))}
      </div>
    );
  };

  // Calculate background style
  const getBackgroundStyle = (): React.CSSProperties => {
    // If slide has custom background color, use it
    if (slide?.backgroundColor) {
      return { backgroundColor: `hsl(${slide.backgroundColor})` };
    }
    
    // Use design system background
    if (ds.backgroundType === 'gradient' && ds.gradientFrom && ds.gradientTo) {
      return {
        background: `linear-gradient(${ds.gradientAngle || 135}deg, hsl(${ds.gradientFrom}), hsl(${ds.gradientTo}))`,
      };
    }
    
    return { backgroundColor: `hsl(${ds.backgroundColor})` };
  };

  return (
    <div 
      className="h-full w-full flex flex-col overflow-hidden"
      style={{ 
        ...getBackgroundStyle(),
        fontFamily: ds.fontFamily,
      }}
    >
      {/* Прогресс бар */}
      {showProgress && renderProgressBar()}

      {/* Контент */}
      <div className="flex-1 min-h-0 overflow-auto">
        {renderContent()}
      </div>

      {/* Фидбек */}
      {renderFeedback()}

      {/* Нижняя навигация */}
      <div 
        className="p-5 flex-shrink-0"
        style={{ 
          backgroundColor: answerState === 'correct' 
            ? getSoftBackgroundColor(ds.successColor, 85)
            : answerState === 'partial'
              ? getSoftBackgroundColor(ds.partialColor, 90)
              : answerState === 'incorrect'
                ? getSoftBackgroundColor(ds.destructiveColor, 95)
                : 'transparent',
        }}
      >
        {isInteractive && answerState === 'idle' ? (
          <button
            onClick={checkAnswer}
            disabled={!canCheck()}
            className={cn(
              "w-full h-12 font-bold uppercase tracking-wide transition-all",
              pressAnimationClass
            )}
            style={{
              backgroundColor: canCheck() ? `hsl(${ds.primaryColor})` : `hsl(${ds.mutedColor})`,
              color: canCheck() ? `hsl(${ds.primaryForeground})` : `hsl(${ds.foregroundColor} / 0.5)`,
              borderRadius: getButtonRadius(),
              ...(canCheck() ? getRaisedButtonStyle(ds.primaryColor) : {}),
            }}
          >
            ПРОВЕРИТЬ
          </button>
        ) : (
          <button
            onClick={() => {
              playSound('swipe', soundConfig);
              onContinue?.();
            }}
            className={cn("w-full h-12 font-bold uppercase tracking-wide", pressAnimationClass)}
            style={{
              backgroundColor: answerState === 'correct' 
                ? `hsl(${ds.successColor})` 
                : answerState === 'partial'
                  ? `hsl(${ds.partialColor})`
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
                  ? getRaisedButtonStyle(ds.partialColor)
                  : answerState === 'incorrect'
                    ? getRaisedButtonStyle(ds.destructiveColor)
                    : getRaisedButtonStyle(ds.primaryColor)),
            }}
          >
            {answerState === 'incorrect' ? 'ПОНЯТНО' : 'ДАЛЕЕ'}
          </button>
        )}
      </div>
    </div>
  );
};
