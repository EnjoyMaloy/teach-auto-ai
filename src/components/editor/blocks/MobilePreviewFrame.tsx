import React, { useState, useEffect } from 'react';
import { Block, BLOCK_CONFIGS } from '@/types/blocks';
import { cn } from '@/lib/utils';
import { 
  Play, Volume2, Check, X,
  ChevronRight, RotateCcw, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobilePreviewFrameProps {
  block: Block | null;
  lessonTitle?: string;
  blockIndex?: number;
  totalBlocks?: number;
  onContinue?: () => void;
}

type AnswerState = 'idle' | 'correct' | 'incorrect';

export const MobilePreviewFrame: React.FC<MobilePreviewFrameProps> = ({
  block,
  lessonTitle = 'Урок',
  blockIndex = 0,
  totalBlocks = 1,
  onContinue,
}) => {
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
  };

  if (!block) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-full max-h-[calc(100vh-200px)] aspect-[9/16] bg-card rounded-2xl overflow-hidden flex items-center justify-center border border-border shadow-lg">
          <div className="text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Выберите блок для предпросмотра
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isInteractive = ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'slider', 'matching', 'ordering', 'hotspot'].includes(block.type);

  const renderContent = () => {
    switch (block.type) {
      case 'heading':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <h1 className="text-2xl font-bold text-center text-foreground">
              {block.content || 'Заголовок'}
            </h1>
          </div>
        );

      case 'text':
        return (
          <div className="flex-1 flex items-center p-6">
            <p className="text-base leading-relaxed text-foreground">
              {block.content || 'Текст блока...'}
            </p>
          </div>
        );

      case 'image':
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            {block.imageUrl ? (
              <img 
                src={block.imageUrl} 
                alt="" 
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <div className="w-full aspect-square bg-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
                <span className="text-muted-foreground text-sm">Нет изображения</span>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full aspect-video bg-foreground rounded-2xl flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-sm">
                <Play className="w-8 h-8 text-primary-foreground ml-1" />
              </div>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-10 h-10 text-primary" />
            </div>
            <p className="text-center text-foreground font-medium">
              {block.content || 'Аудио файл'}
            </p>
            <div className="w-full h-10 flex items-center justify-center gap-0.5">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary/40 rounded-full"
                  style={{ height: `${20 + Math.random() * 80}%` }}
                />
              ))}
            </div>
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
            <p className="text-lg font-semibold mb-4 text-center text-foreground">
              {block.content || 'Вопрос?'}
            </p>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {(block.options || []).map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                const showResult = answerState !== 'idle';
                
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (answerState !== 'idle') return;
                      setSelectedOptions([option.id]);
                    }}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-all text-sm border-2',
                      showResult && option.isCorrect && 'border-success bg-success/10 text-success',
                      showResult && isSelected && !option.isCorrect && 'border-destructive bg-destructive/10 text-destructive',
                      !showResult && isSelected && 'border-primary bg-primary/10 text-primary',
                      !showResult && !isSelected && 'border-border bg-card text-foreground hover:border-primary/50'
                    )}
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
            <p className="text-lg font-semibold mb-4 text-center text-foreground">
              {block.content || 'Вопрос?'}
            </p>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {(block.options || []).map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                const showResult = answerState !== 'idle';
                
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
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-all text-sm border-2 flex items-center gap-2',
                      showResult && option.isCorrect && 'border-success bg-success/10 text-success',
                      showResult && isSelected && !option.isCorrect && 'border-destructive bg-destructive/10 text-destructive',
                      !showResult && isSelected && 'border-primary bg-primary/10 text-primary',
                      !showResult && !isSelected && 'border-border bg-card text-foreground hover:border-primary/50'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                      isSelected ? 'border-current bg-current' : 'border-current'
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-card" />}
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
        return (
          <div className="flex-1 flex flex-col p-4">
            <p className="text-lg font-semibold mb-6 text-center flex-1 flex items-center justify-center text-foreground">
              {block.content || 'Утверждение верно?'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  if (answerState !== 'idle') return;
                  setTrueFalseAnswer(true);
                }}
                className={cn(
                  'p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all',
                  showTFResult && block.correctAnswer === true && 'bg-success/10 border-success text-success',
                  showTFResult && trueFalseAnswer === true && block.correctAnswer !== true && 'bg-destructive/10 border-destructive text-destructive',
                  !showTFResult && trueFalseAnswer === true && 'bg-primary/10 border-primary text-primary',
                  !showTFResult && trueFalseAnswer !== true && 'bg-card border-border text-foreground hover:border-primary/50'
                )}
              >
                <Check className="w-8 h-8" />
                <span className="font-semibold">Да</span>
              </button>
              <button 
                onClick={() => {
                  if (answerState !== 'idle') return;
                  setTrueFalseAnswer(false);
                }}
                className={cn(
                  'p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all',
                  showTFResult && block.correctAnswer === false && 'bg-success/10 border-success text-success',
                  showTFResult && trueFalseAnswer === false && block.correctAnswer !== false && 'bg-destructive/10 border-destructive text-destructive',
                  !showTFResult && trueFalseAnswer === false && 'bg-primary/10 border-primary text-primary',
                  !showTFResult && trueFalseAnswer !== false && 'bg-card border-border text-foreground hover:border-primary/50'
                )}
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
    <div className="h-full flex items-center justify-center">
      <div className="h-full max-h-[calc(100vh-200px)] aspect-[9/16] bg-card rounded-2xl overflow-hidden flex flex-col border border-border shadow-lg">
        {/* Progress bar */}
        <div className="h-8 flex items-center justify-center bg-muted/30">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalBlocks }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all',
                  i === blockIndex
                    ? 'w-5 bg-primary'
                    : i < blockIndex
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-border'
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Result feedback */}
        {answerState !== 'idle' && (
          <div className={cn(
            "px-4 py-2 text-center text-sm font-medium",
            answerState === 'correct' && "bg-success/10 text-success",
            answerState === 'incorrect' && "bg-destructive/10 text-destructive"
          )}>
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
        <div className="h-14 border-t border-border flex items-center justify-center gap-2 px-4 bg-card">
          {isInteractive && answerState !== 'idle' && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetState}
              className="h-10"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Заново
            </Button>
          )}
          <Button
            onClick={() => {
              if (isInteractive && answerState === 'idle') {
                checkAnswer();
              } else {
                onContinue?.();
              }
            }}
            className="flex-1 h-10"
            disabled={isInteractive && answerState === 'idle' && selectedOptions.length === 0 && trueFalseAnswer === null && !fillBlankInput && Object.keys(matchingSelected.pairs).length === 0}
          >
            {isInteractive && answerState === 'idle' ? 'Проверить' : 'Продолжить'}
          </Button>
        </div>
      </div>
    </div>
  );
};
