import React from 'react';
import { Block, BlockType, BLOCK_CONFIGS, BlockOption } from '@/types/blocks';
import { SubBlock, SubBlockType, SUB_BLOCK_CONFIGS, createSubBlock } from '@/types/designBlock';
import { BackgroundPreset } from '@/types/designSystem';
import { SubBlockSettingsEditor } from './SubBlockSettingsEditor';

import { BlockBackgroundSelector } from './BlockBackgroundSelector';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VideoUploader } from './VideoUploader';
import { AudioUploader } from './AudioUploader';
import {
  Plus, Trash2, GripVertical, Upload,
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2,
  Lightbulb, Layers, CheckCircle, XCircle, AlertCircle,
  MousePointerClick, Minus, Sparkles, Tag, RotateCcw, Table
} from 'lucide-react';

const iconMap = {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2, Layers
};

const subBlockIconMap = {
  Heading, Type, Image, MousePointerClick, Minus, Sparkles, Tag, Play, Table
};

interface BlockEditorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  selectedSubBlockId?: string | null;
  onSelectSubBlock?: (id: string | null) => void;
  themeBackgrounds?: BackgroundPreset[];
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  onUpdate,
  onDelete,
  selectedSubBlockId,
  onSelectSubBlock,
  themeBackgrounds = [],
}) => {
  const config = BLOCK_CONFIGS[block.type];
  
  // Guard against missing block config (e.g., removed hotspot blocks)
  if (!config) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-muted-foreground">
        <p>Этот тип блока больше не поддерживается</p>
      </div>
    );
  }
  
  const IconComponent = iconMap[config.icon as keyof typeof iconMap];

  const addOption = () => {
    const newOption: BlockOption = {
      id: crypto.randomUUID(),
      text: `Вариант ${(block.options?.length || 0) + 1}`,
      isCorrect: false,
    };
    onUpdate({ options: [...(block.options || []), newOption] });
  };

  const updateOption = (optionId: string, updates: Partial<BlockOption>) => {
    onUpdate({
      options: block.options?.map(opt =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      ),
    });
  };

  const deleteOption = (optionId: string) => {
    onUpdate({
      options: block.options?.filter(opt => opt.id !== optionId),
    });
  };

  const toggleCorrectOption = (optionId: string) => {
    if (block.type === 'single_choice') {
      onUpdate({
        options: block.options?.map(opt => ({
          ...opt,
          isCorrect: opt.id === optionId,
        })),
      });
    } else {
      onUpdate({
        options: block.options?.map(opt =>
          opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
        ),
      });
    }
  };

  const isDesignBlock = block.type === 'design';
  
  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bgClass)}>
            {IconComponent && <IconComponent className={cn('w-5 h-5', config.colorClass)} />}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{config.labelRu}</h3>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            // Reset block content based on type
            const resetData: Partial<Block> = {
              content: '',
              imageUrl: undefined,
              videoUrl: undefined,
              audioUrl: undefined,
              options: block.type === 'single_choice' || block.type === 'multiple_choice' 
                ? [{ id: crypto.randomUUID(), text: 'Вариант 1', isCorrect: false }]
                : block.type === 'true_false'
                ? [
                    { id: crypto.randomUUID(), text: 'Верно', isCorrect: true },
                    { id: crypto.randomUUID(), text: 'Неверно', isCorrect: false },
                  ]
                : undefined,
              correctAnswer: undefined,
              explanation: undefined,
              explanationCorrect: undefined,
              explanationPartial: undefined,
              blankWord: undefined,
              matchingPairs: block.type === 'matching' 
                ? [{ id: crypto.randomUUID(), left: '', right: '' }]
                : undefined,
              orderingItems: block.type === 'ordering' ? [''] : undefined,
              correctOrder: undefined,
              sliderMin: block.type === 'slider' ? 0 : undefined,
              sliderMax: block.type === 'slider' ? 100 : undefined,
              sliderCorrect: block.type === 'slider' ? 50 : undefined,
              sliderStep: block.type === 'slider' ? 1 : undefined,
              subBlocks: block.type === 'design' ? [] : undefined,
            };
            onUpdate(resetData);
          }}
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
          title="Сбросить контент"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Background selector - show if theme has backgrounds */}
        {themeBackgrounds.length > 0 && (
          <BlockBackgroundSelector
            backgrounds={themeBackgrounds}
            selectedBackgroundId={block.backgroundId}
            onChange={(backgroundId) => onUpdate({ backgroundId })}
          />
        )}
        
        {/* Content field */}
        {['heading', 'text', 'image_text', 'single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'slider'].includes(block.type) && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium">
              {block.type === 'heading' ? 'Заголовок' : 
               ['single_choice', 'multiple_choice', 'true_false'].includes(block.type) ? 'Вопрос' :
               block.type === 'fill_blank' ? 'Текст (используйте ___ для пропуска)' :
               'Текст'}
            </Label>
            {block.type === 'heading' ? (
              <div className="space-y-1">
                <textarea
                  value={block.content}
                  onChange={(e) => {
                    if (e.target.value.length <= 75) {
                      onUpdate({ content: e.target.value });
                    }
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="Введите заголовок..."
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-lg font-normal ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
                  maxLength={75}
                  style={{ minHeight: '44px', resize: 'none' }}
                />
                <p className="text-xs text-muted-foreground text-right">{block.content.length}/75</p>
              </div>
            ) : (
              <Textarea
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Введите текст..."
                rows={block.type === 'text' ? 6 : 3}
                className="rounded-xl resize-none"
              />
            )}
          </div>
        )}

        {/* Text size selector for text block */}
        {block.type === 'text' && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Размер текста</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'small', label: 'S', desc: 'Мелкий' },
                { value: 'medium', label: 'M', desc: 'Средний' },
                { value: 'large', label: 'L', desc: 'Крупный' },
                { value: 'xlarge', label: 'XL', desc: 'Очень крупный' },
              ].map((size) => (
                <button
                  key={size.value}
                  onClick={() => onUpdate({ textSize: size.value as Block['textSize'] })}
                  className={cn(
                    'p-3 rounded-xl border-2 text-center transition-all',
                    (block.textSize || 'medium') === size.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-lg font-bold">{size.label}</span>
                  <p className="text-xs text-muted-foreground mt-1">{size.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image upload */}
        {['image_text'].includes(block.type) && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Изображение</Label>
            <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center bg-muted/30 hover:bg-muted/50 transition-colors">
              {block.imageUrl ? (
                <div className="relative">
                  <img src={block.imageUrl} alt="" className="w-full rounded-xl object-cover aspect-[9/16]" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 rounded-lg"
                    onClick={() => onUpdate({ imageUrl: undefined })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="block py-8 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result as string;
                          onUpdate({ imageUrl: result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-3 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Нажмите для загрузки изображения
                  </p>
                  <p className="text-xs text-muted-foreground">или</p>
                  <Input
                    type="text"
                    placeholder="Вставьте URL изображения..."
                    className="max-w-xs mx-auto rounded-xl mt-2"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdate({ imageUrl: e.target.value })}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Video upload */}
        {block.type === 'video' && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Видео</Label>
            <VideoUploader
              videoUrl={block.videoUrl}
              onUpdate={(url) => onUpdate({ videoUrl: url })}
            />
          </div>
        )}

        {/* Audio upload */}
        {block.type === 'audio' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Название трека</Label>
              <Input
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Название трека..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Аудио файл</Label>
              <AudioUploader
                audioUrl={block.audioUrl}
                audioName={block.content}
                onUpdate={(url, name) => {
                  if (name && !block.content) {
                    onUpdate({ audioUrl: url, content: name });
                  } else {
                    onUpdate({ audioUrl: url });
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Options for quiz types */}
        {['single_choice', 'multiple_choice'].includes(block.type) && (
          <div className="space-y-3">
            <Label className="text-foreground font-medium">Варианты ответа</Label>
            <div className="space-y-2">
              {(block.options || []).map((option, idx) => (
                <div key={option.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCorrectOption(option.id)}
                    className={cn(
                      'w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      option.isCorrect
                        ? 'border-success bg-success text-white'
                        : 'border-border hover:border-success bg-card'
                    )}
                  >
                    {option.isCorrect && <span className="text-xs font-bold">✓</span>}
                  </button>
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(option.id, { text: e.target.value })}
                    placeholder={`Вариант ${idx + 1}`}
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteOption(option.id)}
                    className="text-muted-foreground hover:text-destructive rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="soft" size="sm" onClick={addOption} className="rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" />
              Добавить вариант
            </Button>
            
            {/* Explanation fields */}
            <div className="space-y-3 pt-3 border-t border-border">
              {/* Для single_choice показываем объяснение для правильного ответа */}
              {block.type === 'single_choice' && (
                <div className="space-y-2">
                  <Label className="text-foreground font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    Объяснение почему это правильный ответ
                  </Label>
                  <Textarea
                    value={block.explanationCorrect || ''}
                    onChange={(e) => onUpdate({ explanationCorrect: e.target.value })}
                    placeholder="Объясните, почему этот ответ правильный..."
                    className="rounded-xl resize-none placeholder:text-muted-foreground/50"
                    rows={2}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Объяснение почему это неправильный ответ
                </Label>
                <Textarea
                  value={block.explanation || ''}
                  onChange={(e) => onUpdate({ explanation: e.target.value })}
                  placeholder="Объясните, почему другие ответы неправильные..."
                  className="rounded-xl resize-none placeholder:text-muted-foreground/50"
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* True/False toggle */}
        {block.type === 'true_false' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Правильный ответ</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant={block.correctAnswer === true ? 'default' : 'outline'}
                  onClick={() => onUpdate({ correctAnswer: true })}
                  className="flex-1 rounded-xl"
                >
                  Да
                </Button>
                <Button
                  variant={block.correctAnswer === false ? 'default' : 'outline'}
                  onClick={() => onUpdate({ correctAnswer: false })}
                  className="flex-1 rounded-xl"
                >
                  Нет
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                Объяснение при неправильном ответе
              </Label>
              <Textarea
                value={block.explanation || ''}
                onChange={(e) => onUpdate({ explanation: e.target.value })}
                placeholder="Объясните, почему ответ неправильный..."
                className="rounded-xl resize-none placeholder:text-muted-foreground/50"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Fill blank word */}
        {block.type === 'fill_blank' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center gap-2">
                Вставить пропуск в текст
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => {
                    const textarea = document.querySelector('textarea[placeholder="Введите текст..."]') as HTMLTextAreaElement;
                    if (textarea) {
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = block.content;
                      const newText = text.slice(0, start) + '___' + text.slice(end);
                      onUpdate({ content: newText });
                    } else {
                      // If no cursor, append to content
                      onUpdate({ content: (block.content || '') + ' ___ ' });
                    }
                  }}
                  className="rounded-lg text-xs"
                >
                  Вставить ___
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground">
                Нажмите кнопку или введите ___ в тексте выше для обозначения пропуска
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Правильное слово</Label>
              <Input
                value={block.blankWord || ''}
                onChange={(e) => onUpdate({ blankWord: e.target.value })}
                placeholder="Слово для пропуска..."
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Регистр не учитывается при проверке
              </p>
            </div>
          </div>
        )}

        {/* Slider settings */}
        {block.type === 'slider' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-xs">Мин</Label>
                <Input
                  type="number"
                  value={block.sliderMin || 0}
                  onChange={(e) => onUpdate({ sliderMin: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-xs">Макс</Label>
                <Input
                  type="number"
                  value={block.sliderMax || 100}
                  onChange={(e) => onUpdate({ sliderMax: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium text-xs">Шаг</Label>
                <Input
                  type="number"
                  value={block.sliderStep || 1}
                  onChange={(e) => onUpdate({ sliderStep: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Правильный ответ</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Точное значение или от</Label>
                  <Input
                    type="number"
                    value={block.sliderCorrect ?? 50}
                    onChange={(e) => onUpdate({ sliderCorrect: Number(e.target.value) })}
                    className="rounded-xl"
                    placeholder="Точное или мин"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">До (для диапазона)</Label>
                  <Input
                    type="number"
                    value={block.sliderCorrectMax ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdate({ sliderCorrectMax: val ? Number(val) : undefined });
                    }}
                    className="rounded-xl"
                    placeholder="Оставьте пустым"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Оставьте "До" пустым для точного ответа, или укажите диапазон
              </p>
            </div>
          </div>
        )}

        {/* Matching pairs */}
        {block.type === 'matching' && (
          <div className="space-y-3">
            <Label className="text-foreground font-medium">Пары</Label>
            <div className="space-y-2">
              {(block.matchingPairs || []).map((pair) => (
                <div key={pair.id} className="flex items-center gap-2">
                  <Input
                    value={pair.left}
                    onChange={(e) => onUpdate({
                      matchingPairs: block.matchingPairs?.map(p =>
                        p.id === pair.id ? { ...p, left: e.target.value } : p
                      ),
                    })}
                    placeholder="Левый"
                    className="flex-1 rounded-xl"
                  />
                  <span className="text-primary font-bold">→</span>
                  <Input
                    value={pair.right}
                    onChange={(e) => onUpdate({
                      matchingPairs: block.matchingPairs?.map(p =>
                        p.id === pair.id ? { ...p, right: e.target.value } : p
                      ),
                    })}
                    placeholder="Правый"
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpdate({
                      matchingPairs: block.matchingPairs?.filter(p => p.id !== pair.id),
                    })}
                    className="text-muted-foreground hover:text-destructive rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="soft"
              size="sm"
              onClick={() => onUpdate({
                matchingPairs: [
                  ...(block.matchingPairs || []),
                  { id: crypto.randomUUID(), left: '', right: '' },
                ],
              })}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Добавить пару
            </Button>
          </div>
        )}

        {/* Ordering items */}
        {block.type === 'ordering' && (
          <div className="space-y-3">
            <Label className="text-foreground font-medium">Пункты (в правильном порядке)</Label>
            <div className="space-y-2">
              {(block.orderingItems || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <Input
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(block.orderingItems || [])];
                      newItems[idx] = e.target.value;
                      onUpdate({ orderingItems: newItems, correctOrder: newItems });
                    }}
                    placeholder={`Пункт ${idx + 1}`}
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newItems = block.orderingItems?.filter((_, i) => i !== idx);
                      onUpdate({ orderingItems: newItems, correctOrder: newItems });
                    }}
                    className="text-muted-foreground hover:text-destructive rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="soft"
              size="sm"
              onClick={() => {
                const newItems = [...(block.orderingItems || []), ''];
                onUpdate({ orderingItems: newItems, correctOrder: newItems });
              }}
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Добавить пункт
            </Button>
          </div>
        )}

        {/* Design block - sub-block settings or add menu */}
        {isDesignBlock && (
          <>
            {selectedSubBlockId && block.subBlocks?.find(sb => sb.id === selectedSubBlockId) ? (
              <SubBlockSettingsEditor
                subBlock={block.subBlocks.find(sb => sb.id === selectedSubBlockId)!}
                onUpdate={(updates) => {
                  const updatedSubBlocks = block.subBlocks?.map(sb =>
                    sb.id === selectedSubBlockId ? { ...sb, ...updates } : sb
                  );
                  onUpdate({ subBlocks: updatedSubBlocks });
                }}
                onClose={() => onSelectSubBlock?.(null)}
                onReplaceAllBlocks={(newBlocks) => {
                  // Replace all sub-blocks with AI-generated ones
                  const blocksWithIds = newBlocks.map((block, index) => ({
                    ...block,
                    id: block.id || crypto.randomUUID(),
                    order: index,
                  })) as SubBlock[];
                  onUpdate({ subBlocks: blocksWithIds });
                  onSelectSubBlock?.(null);
                }}
              />
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground px-1 mb-2">Добавить элемент:</p>
                {Object.values(SUB_BLOCK_CONFIGS).map((config) => {
                  const IconComponent = subBlockIconMap[config.icon as keyof typeof subBlockIconMap];
                  return (
                    <button
                      key={config.type}
                      onClick={() => {
                        const currentSubBlocks = block.subBlocks || [];
                        const newSubBlock = createSubBlock(config.type, currentSubBlocks.length);
                        onUpdate({ subBlocks: [...currentSubBlocks, newSubBlock] });
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        {IconComponent && <IconComponent className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{config.labelRu}</p>
                        <p className="text-xs text-muted-foreground truncate">{config.description}</p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
