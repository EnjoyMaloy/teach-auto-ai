import React, { useState, useEffect } from 'react';
import { Block } from '@/types/blocks';
import { CourseDesignSystem } from '@/types/course';
import { cn } from '@/lib/utils';
import { RotateCcw, Sparkles, X, AlertCircle } from 'lucide-react';
import { playSound, SoundConfig } from '@/lib/sounds';
import { DEFAULT_SOUND_SETTINGS } from '@/types/designSystem';

interface SlideViewProps {
  block: Block;
  designSystem?: CourseDesignSystem;
  onContinue?: () => void;
  isReadOnly?: boolean;
  isMuted?: boolean;
}

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

type AnswerState = 'idle' | 'correct' | 'incorrect' | 'partial';

export const SlideView: React.FC<SlideViewProps> = ({
  block,
  designSystem,
  onContinue,
  isReadOnly = false,
  isMuted = false,
}) => {
  const ds = { ...DEFAULT_DS, ...designSystem };
  
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

  useEffect(() => {
    if (block?.orderingItems && answerState === 'idle') {
      setOrderingItems([...block.orderingItems].sort(() => Math.random() - 0.5));
    }
  }, [JSON.stringify(block?.orderingItems)]);

  useEffect(() => {
    if (block?.matchingPairs && answerState === 'idle') {
      setShuffledRights([...block.matchingPairs.map(p => p.right)].sort(() => Math.random() - 0.5));
    }
  }, [JSON.stringify(block?.matchingPairs)]);

  const resetState = () => {
    setSelectedOptions([]);
    setTrueFalseAnswer(null);
    setSliderValue(block?.sliderMin || 0);
    setFillBlankInput('');
    setAnswerState('idle');
    setMatchingSelected({ left: null, pairs: {} });
    if (block?.matchingPairs) {
      setShuffledRights([...block.matchingPairs.map(p => p.right)].sort(() => Math.random() - 0.5));
    }
    setOrderingItems(block?.orderingItems ? [...block.orderingItems].sort(() => Math.random() - 0.5) : []);
  };

  const isInteractive = ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'slider', 'matching', 'ordering'].includes(block?.type || '');
  
  const isRaised = designSystem?.buttonDepth !== 'flat';
  const pressAnimationClass = isRaised ? 'btn-raised' : 'btn-flat';

  const getButtonRadius = () => {
    const style = designSystem?.buttonStyle || 'rounded';
    switch (style) {
      case 'square': return '4px';
      case 'pill': return '9999px';
      default: return designSystem?.borderRadius || '0.75rem';
    }
  };

  const getRaisedButtonStyle = (color: string) => {
    if (!isRaised) return {};
    return {
      boxShadow: `0 4px 0 0 hsl(${color} / 0.4), 0 6px 12px -2px hsl(${color} / 0.25)`,
    };
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
          setAnswerState('partial');
          playSound('incorrect', soundConfig);
          return;
        }
        break;
      case 'true_false':
        isCorrect = trueFalseAnswer === block.correctAnswer;
        break;
      case 'fill_blank':
        isCorrect = fillBlankInput.toLowerCase().trim() === (block.blankWord || '').toLowerCase().trim();
        break;
      case 'slider':
        const tolerance = ((block.sliderMax || 100) - (block.sliderMin || 0)) * 0.05;
        isCorrect = Math.abs(sliderValue - (block.sliderCorrect || 50)) <= tolerance;
        break;
      case 'matching':
        if (block.matchingPairs) {
          isCorrect = block.matchingPairs.every(pair => matchingSelected.pairs[pair.left] === pair.right);
        }
        break;
      case 'ordering':
        if (block.correctOrder) {
          isCorrect = JSON.stringify(orderingItems) === JSON.stringify(block.correctOrder);
        }
        break;
    }

    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect ? 'correct' : 'incorrect', soundConfig);
  };

  const canCheck = () => {
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
        return true;
      case 'matching':
        return block.matchingPairs ? Object.keys(matchingSelected.pairs).length === block.matchingPairs.length : false;
      case 'ordering':
        return orderingItems.length > 0;
      default:
        return true;
    }
  };

  const handleContinue = () => {
    playSound('swipe', soundConfig);
    onContinue?.();
  };

  // Render content based on block type
  const renderContent = () => {
    if (!block) return null;

    const contentStyle = {
      color: block.textColor || `hsl(${ds.foregroundColor})`,
    };

    switch (block.type) {
      case 'text':
        return (
          <div className="text-center w-full max-w-sm">
            <p className="text-base leading-relaxed" style={contentStyle}>
              {block.content}
            </p>
          </div>
        );

      case 'image_text':
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            {block.imageUrl && (
              <img
                src={block.imageUrl}
                alt=""
                className="w-full max-h-48 object-cover rounded-2xl"
              />
            )}
            <p className="text-base leading-relaxed text-center" style={contentStyle}>
              {block.content}
            </p>
          </div>
        );

      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <p className="text-base font-medium text-center" style={contentStyle}>
              {block.content}
            </p>
            <div className="flex flex-col gap-2 w-full">
              {block.options?.map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                const showResult = answerState !== 'idle';
                const isCorrectOption = option.isCorrect;

                let optionStyle: React.CSSProperties = {
                  borderColor: `hsl(${ds.mutedColor})`,
                  backgroundColor: isSelected ? `hsl(${ds.primaryColor} / 0.1)` : 'transparent',
                };

                if (showResult) {
                  if (isCorrectOption) {
                    optionStyle = {
                      borderColor: `hsl(${ds.successColor})`,
                      backgroundColor: `hsl(${ds.successColor} / 0.1)`,
                    };
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = {
                      borderColor: `hsl(${ds.destructiveColor})`,
                      backgroundColor: `hsl(${ds.destructiveColor} / 0.1)`,
                    };
                  }
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (answerState !== 'idle' || isReadOnly) return;
                      if (block.type === 'single_choice') {
                        setSelectedOptions([option.id]);
                      } else {
                        setSelectedOptions(prev =>
                          prev.includes(option.id)
                            ? prev.filter(id => id !== option.id)
                            : [...prev, option.id]
                        );
                      }
                      playSound('tap', soundConfig);
                    }}
                    className="p-3 rounded-xl border-2 text-left transition-all"
                    style={optionStyle}
                    disabled={answerState !== 'idle' || isReadOnly}
                  >
                    <span style={{ color: `hsl(${ds.foregroundColor})` }}>{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <p className="text-base font-medium text-center" style={contentStyle}>
              {block.content}
            </p>
            <div className="flex gap-3 w-full">
              {[true, false].map((value) => {
                const isSelected = trueFalseAnswer === value;
                const showResult = answerState !== 'idle';
                const isCorrectOption = block.correctAnswer === value;

                let btnStyle: React.CSSProperties = {
                  borderColor: isSelected ? `hsl(${ds.primaryColor})` : `hsl(${ds.mutedColor})`,
                  backgroundColor: isSelected ? `hsl(${ds.primaryColor} / 0.1)` : 'transparent',
                };

                if (showResult) {
                  if (isCorrectOption) {
                    btnStyle = {
                      borderColor: `hsl(${ds.successColor})`,
                      backgroundColor: `hsl(${ds.successColor} / 0.1)`,
                    };
                  } else if (isSelected && !isCorrectOption) {
                    btnStyle = {
                      borderColor: `hsl(${ds.destructiveColor})`,
                      backgroundColor: `hsl(${ds.destructiveColor} / 0.1)`,
                    };
                  }
                }

                return (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => {
                      if (answerState !== 'idle' || isReadOnly) return;
                      setTrueFalseAnswer(value);
                      playSound('tap', soundConfig);
                    }}
                    className="flex-1 p-4 rounded-xl border-2 text-center font-medium transition-all"
                    style={btnStyle}
                    disabled={answerState !== 'idle' || isReadOnly}
                  >
                    <span style={{ color: `hsl(${ds.foregroundColor})` }}>
                      {value ? 'Верно' : 'Неверно'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center w-full max-w-sm">
            <p className="text-base leading-relaxed" style={contentStyle}>
              {block.content || 'Контент слайда'}
            </p>
          </div>
        );
    }
  };

  // Result feedback
  const resultFeedback = answerState !== 'idle' && (
    <div 
      className="px-4 py-3 text-center text-sm font-medium shrink-0"
      style={{
        backgroundColor: answerState === 'correct' 
          ? `hsl(${ds.successColor} / 0.1)` 
          : answerState === 'partial'
            ? `hsl(45 93% 47% / 0.1)`
            : `hsl(${ds.destructiveColor} / 0.1)`,
        color: answerState === 'correct' 
          ? `hsl(${ds.successColor})` 
          : answerState === 'partial'
            ? `hsl(45 93% 40%)`
            : `hsl(${ds.destructiveColor})`,
      }}
    >
      <div className="flex items-center justify-center gap-2">
        {answerState === 'correct' ? (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Правильно!</span>
          </>
        ) : answerState === 'partial' ? (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Почти!</span>
          </>
        ) : (
          <>
            <X className="w-4 h-4" />
            <span>Неправильно</span>
          </>
        )}
      </div>
    </div>
  );

  // Bottom nav height
  const NAV_HEIGHT = 80; // h-20 = 80px

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      style={{ 
        backgroundColor: `hsl(${ds.backgroundColor})`,
        fontFamily: ds.fontFamily,
      }}
    >
      {/* Content area - absolute positioned to fill space above bottom nav */}
      <div 
        className="absolute inset-0 overflow-auto flex flex-col justify-center items-center px-4 py-4"
        style={{ 
          bottom: `${NAV_HEIGHT}px`,
        }}
      >
        {renderContent()}
      </div>

      {/* Result feedback - positioned above bottom nav */}
      {answerState !== 'idle' && (
        <div 
          className="absolute left-0 right-0 px-4 py-3 text-center text-sm font-medium"
          style={{
            bottom: `${NAV_HEIGHT}px`,
            backgroundColor: answerState === 'correct' 
              ? `hsl(142 76% 92%)` 
              : answerState === 'partial'
                ? `hsl(48 100% 90%)`
                : `hsl(0 100% 95%)`,
            color: answerState === 'correct' 
              ? `hsl(${ds.successColor})` 
              : answerState === 'partial'
                ? `hsl(35 80% 35%)`
                : `hsl(${ds.destructiveColor})`,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            {answerState === 'correct' ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Правильно!</span>
              </>
            ) : answerState === 'partial' ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Почти!</span>
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

      {/* Bottom nav - absolute positioned at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-20 border-t flex items-center justify-center gap-3 px-4"
        style={{ 
          borderColor: (answerState === 'correct' || answerState === 'partial' || answerState === 'incorrect') ? 'transparent' : `hsl(${ds.mutedColor} / 0.3)`,
          backgroundColor: answerState === 'correct' 
            ? `hsl(142 76% 92%)` 
            : answerState === 'partial'
              ? `hsl(48 100% 90%)`
              : answerState === 'incorrect'
                ? `hsl(0 100% 95%)`
                : 'transparent',
        }}
      >
        {/* Show retry button only for partial answers */}
        {isInteractive && answerState === 'partial' && (
          <button
            type="button"
            onClick={resetState}
            className={cn("h-11 px-4 flex items-center gap-2 border-2 font-bold uppercase tracking-wide", pressAnimationClass)}
            style={{
              borderColor: `hsl(45 93% 47%)`,
              backgroundColor: `hsl(0 0% 100%)`,
              color: `hsl(45 93% 47%)`,
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
            if (isInteractive && answerState === 'idle') {
              checkAnswer();
            } else {
              handleContinue();
            }
          }}
          className={cn("flex-1 h-11 max-w-md font-bold uppercase tracking-wide disabled:opacity-50 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]", pressAnimationClass)}
          disabled={isInteractive && answerState === 'idle' && !canCheck()}
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
          {isInteractive && answerState === 'idle' 
            ? 'ПРОВЕРИТЬ' 
            : answerState === 'incorrect' 
              ? 'ПОНЯТНО' 
              : 'ДАЛЕЕ'}
        </button>
      </div>
    </div>
  );
};
