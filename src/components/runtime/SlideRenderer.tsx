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
import { DEFAULT_SOUND_SETTINGS } from '@/types/designSystem';
import { RiveMascot } from './RiveMascot';

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
  const [matchingSelected, setMatchingSelected] = useState<{ left: string | null; pairs: Record<string, string> }>({ left: null, pairs: {} });
  const [shuffledRights, setShuffledRights] = useState<string[]>([]);
  const [orderingItems, setOrderingItems] = useState<string[]>([]);

  // Сброс состояния при смене слайда
  useEffect(() => {
    console.log('[SlideRenderer] Slide changed:', slide?.id, slide?.type);
    setSelectedOptions([]);
    setTrueFalseAnswer(null);
    setSliderValue(slide?.sliderMin || 0);
    setFillBlankInput('');
    setAnswerState('idle');
    setMatchingSelected({ left: null, pairs: {} });
    
    if (slide?.matchingPairs) {
      setShuffledRights([...slide.matchingPairs.map(p => p.right)].sort(() => Math.random() - 0.5));
    }
    if (slide?.orderingItems) {
      setOrderingItems([...slide.orderingItems].sort(() => Math.random() - 0.5));
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
        const allPairsCorrect = slide.matchingPairs?.every(pair => 
          matchingSelected.pairs[pair.left] === pair.right
        ) || false;
        isCorrect = allPairsCorrect && Object.keys(matchingSelected.pairs).length === (slide.matchingPairs?.length || 0);
        break;
      }
      case 'ordering':
        isCorrect = JSON.stringify(orderingItems) === JSON.stringify(slide.orderingItems);
        break;
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
        return Object.keys(matchingSelected.pairs).length > 0;
      case 'ordering':
        return orderingItems.length > 0;
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
    return {
      boxShadow: `0 4px 0 0 hsl(${baseColor} / 0.4), 0 6px 12px -2px hsl(${baseColor} / 0.25)`,
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
              <img src={slide.imageUrl} alt="" className="w-full rounded-2xl object-contain max-h-[60%]" />
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
                        : `hsl(${designSystem?.designBlock?.accentElementColor || ds.primaryColor})`,
                    color: `hsl(${ds.foregroundColor})`,
                  }}
                  placeholder="..."
                />
                {parts[1]}
              </p>
            </div>
          </div>
        );
      }

      case 'slider':
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
              <input
                type="range"
                min={slide.sliderMin || 0}
                max={slide.sliderMax || 100}
                step={slide.sliderStep || 1}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                disabled={answerState !== 'idle'}
                className="w-full"
              />
              <div className="text-center mt-4">
                <span 
                  className="text-3xl font-bold"
                  style={{ color: `hsl(${designSystem?.designBlock?.accentElementColor || ds.primaryColor})` }}
                >
                  {sliderValue}
                </span>
              </div>
            </div>
          </div>
        );

      case 'matching':
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
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                {(slide.matchingPairs || []).map((pair) => {
                  const isSelected = matchingSelected.left === pair.left;
                  const isMatched = pair.left in matchingSelected.pairs;
                  
                  return (
                    <button
                      key={pair.id}
                      onClick={() => {
                        if (answerState !== 'idle' || isMatched) return;
                        setMatchingSelected(prev => ({ ...prev, left: pair.left }));
                      }}
                      disabled={answerState !== 'idle' || isMatched}
                      className="w-full p-3 text-left border-2 transition-all text-sm"
                      style={{
                        borderColor: isMatched 
                          ? `hsl(${ds.successColor})` 
                          : isSelected 
                            ? `hsl(${designSystem?.designBlock?.accentElementColor || ds.primaryColor})` 
                            : `hsl(${ds.mutedColor})`,
                        backgroundColor: isMatched 
                          ? `hsl(${ds.successColor} / 0.1)` 
                          : `hsl(${ds.cardColor})`,
                        borderRadius: ds.borderRadius,
                        color: `hsl(${ds.foregroundColor})`,
                      }}
                    >
                      {pair.left}
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 space-y-2">
                {shuffledRights.map((right, idx) => {
                  const isUsed = Object.values(matchingSelected.pairs).includes(right);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (answerState !== 'idle' || !matchingSelected.left || isUsed) return;
                        setMatchingSelected(prev => ({
                          left: null,
                          pairs: { ...prev.pairs, [prev.left!]: right },
                        }));
                      }}
                      disabled={answerState !== 'idle' || !matchingSelected.left || isUsed}
                      className="w-full p-3 text-left border-2 transition-all text-sm"
                      style={{
                        borderColor: isUsed ? `hsl(${ds.successColor})` : `hsl(${ds.mutedColor})`,
                        backgroundColor: isUsed ? `hsl(${ds.successColor} / 0.1)` : `hsl(${ds.cardColor})`,
                        borderRadius: ds.borderRadius,
                        color: `hsl(${ds.foregroundColor})`,
                        opacity: isUsed ? 0.6 : 1,
                      }}
                    >
                      {right}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'ordering':
        return (
          <div className="flex-1 flex flex-col p-4 overflow-auto h-full min-h-0">
            <p 
              className="text-lg font-semibold mb-4 text-center"
              style={{ 
                color: `hsl(${ds.foregroundColor})`,
                fontFamily: ds.headingFontFamily,
              }}
            >
              {slide.content || 'Расположите в правильном порядке'}
            </p>
            <div className="space-y-2">
              {orderingItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-3 border-2"
                  style={{
                    borderColor: `hsl(${ds.mutedColor})`,
                    backgroundColor: `hsl(${ds.cardColor})`,
                    borderRadius: ds.borderRadius,
                  }}
                >
                  <span 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ 
                      backgroundColor: `hsl(${designSystem?.designBlock?.accentElementColor || ds.primaryColor})`,
                      color: `hsl(${ds.primaryForeground})`,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ color: `hsl(${ds.foregroundColor})` }}>{item}</span>
                  {answerState === 'idle' && (
                    <div className="ml-auto flex gap-1">
                      <button
                        onClick={() => {
                          if (idx === 0) return;
                          const newItems = [...orderingItems];
                          [newItems[idx], newItems[idx - 1]] = [newItems[idx - 1], newItems[idx]];
                          setOrderingItems(newItems);
                        }}
                        className="p-1 text-xs"
                        disabled={idx === 0}
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
                        className="p-1 text-xs"
                        disabled={idx === orderingItems.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

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
    
    // Helper to create soft pastel version of HSL color
    // Input format: "220 70% 50%" or "220 70 50"
    const getSoftColor = (hslColor: string, lightness: number = 90) => {
      const parts = hslColor.split(' ');
      if (parts.length >= 2) {
        const hue = parts[0];
        // Remove % sign if present before parsing
        const satValue = parseInt(parts[1].replace('%', ''));
        const softSat = Math.round(satValue * 0.5); // Reduce saturation for softer look
        return `hsl(${hue} ${softSat}% ${lightness}%)`;
      }
      return `hsl(${hslColor} / 0.15)`;
    };
    
    // Helper to create dark text version of HSL color
    const getDarkTextColor = (hslColor: string) => {
      const parts = hslColor.split(' ');
      if (parts.length >= 2) {
        const hue = parts[0];
        return `hsl(${hue} 60% 30%)`; // Dark version with same hue
      }
      return `hsl(${hslColor})`;
    };
    
    // Solid pastel backgrounds based on configured colors
    // Each state uses its own color from design system
    const bgColor = answerState === 'correct' 
      ? getSoftColor(ds.successColor, 90)
      : answerState === 'partial'
        ? `hsl(48 100% 90%)`
        : getSoftColor(ds.destructiveColor, 93);
    
    // Text color uses corresponding design system color
    const textColor = answerState === 'correct'
      ? getDarkTextColor(ds.successColor)
      : answerState === 'partial'
        ? `hsl(35 80% 35%)`
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
      {showProgress && (
        <div 
          className="h-1 w-full flex-shrink-0"
          style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
        >
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: `hsl(${ds.primaryColor})`,
            }}
          />
        </div>
      )}

      {/* Контент */}
      <div className="flex-1 min-h-0 overflow-auto">
        {renderContent()}
      </div>

      {/* Фидбек */}
      {renderFeedback()}

      {/* Нижняя навигация */}
      <div 
        className="p-5 border-t flex-shrink-0"
        style={{ 
          borderColor: (answerState === 'correct' || answerState === 'partial' || answerState === 'incorrect') ? 'transparent' : `hsl(${ds.mutedColor} / 0.3)`,
          backgroundColor: answerState === 'correct' 
            ? `hsl(88 62% 85%)`
            : answerState === 'partial'
              ? `hsl(48 100% 90%)`
              : answerState === 'incorrect'
                ? `hsl(0 100% 95%)`
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
                  ? `hsl(45 93% 47%)`
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
                  ? getRaisedButtonStyle('45 93% 47%')
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
