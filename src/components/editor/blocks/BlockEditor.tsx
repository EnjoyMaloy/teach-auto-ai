import React from 'react';
import { Block, BlockType, BLOCK_CONFIGS, BlockOption } from '@/types/blocks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Trash2, GripVertical, Upload, Sparkles,
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2,
  Lightbulb
} from 'lucide-react';

const iconMap = {
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2
};

interface BlockEditorProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  onUpdate,
  onDelete,
}) => {
  const config = BLOCK_CONFIGS[block.type];
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

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-surface">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bgClass)}>
            {IconComponent && <IconComponent className={cn('w-5 h-5', config.colorClass)} />}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{config.labelRu}</h3>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Content field */}
        {['heading', 'text', 'image_text', 'single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'slider', 'hotspot'].includes(block.type) && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium">
              {block.type === 'heading' ? 'Заголовок' : 
               ['single_choice', 'multiple_choice', 'true_false'].includes(block.type) ? 'Вопрос' :
               block.type === 'fill_blank' ? 'Текст (используйте ___ для пропуска)' :
               'Текст'}
            </Label>
            {block.type === 'heading' ? (
              <Input
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Введите заголовок..."
                className="text-lg font-bold rounded-xl"
              />
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
        {['image', 'image_text', 'hotspot'].includes(block.type) && (
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

        {/* Video URL */}
        {block.type === 'video' && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium">URL видео</Label>
            <Input
              value={block.videoUrl || ''}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="rounded-xl"
            />
          </div>
        )}

        {/* Audio URL */}
        {block.type === 'audio' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Название</Label>
              <Input
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Название трека..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">URL аудио</Label>
              <Input
                value={block.audioUrl || ''}
                onChange={(e) => onUpdate({ audioUrl: e.target.value })}
                placeholder="https://..."
                className="rounded-xl"
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
          </div>
        )}

        {/* True/False toggle */}
        {block.type === 'true_false' && (
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
        )}

        {/* Fill blank word */}
        {block.type === 'fill_blank' && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Правильное слово</Label>
            <Input
              value={block.blankWord || ''}
              onChange={(e) => onUpdate({ blankWord: e.target.value })}
              placeholder="Слово для пропуска..."
              className="rounded-xl"
            />
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
              <Input
                type="number"
                value={block.sliderCorrect || 50}
                onChange={(e) => onUpdate({ sliderCorrect: Number(e.target.value) })}
                className="rounded-xl"
              />
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

        {/* Explanation field */}
        {['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'slider', 'hotspot'].includes(block.type) && (
          <div className="space-y-2">
            <Label className="text-foreground font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-warning-foreground" />
              Объяснение
            </Label>
            <Textarea
              value={block.explanation || ''}
              onChange={(e) => onUpdate({ explanation: e.target.value })}
              placeholder="Почему это правильный ответ..."
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>
        )}
      </div>

      {/* AI Actions */}
      <div className="px-5 py-4 border-t border-border bg-gradient-surface">
        <Button variant="soft-ai" size="sm" className="w-full rounded-xl">
          <Sparkles className="w-4 h-4 mr-2" />
          Улучшить с AI
        </Button>
      </div>
    </div>
  );
};
