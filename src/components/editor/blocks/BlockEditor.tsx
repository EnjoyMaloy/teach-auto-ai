import React from 'react';
import { Block, BlockType, BLOCK_CONFIGS, BlockOption } from '@/types/blocks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Trash2, GripVertical, Upload, Sparkles,
  Heading, Type, Image, Play, Volume2, LayoutList,
  CircleDot, CheckSquare, ToggleLeft, PenLine,
  Link2, ListOrdered, SlidersHorizontal, MousePointer2
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
      // Only one correct answer
      onUpdate({
        options: block.options?.map(opt => ({
          ...opt,
          isCorrect: opt.id === optionId,
        })),
      });
    } else {
      // Multiple correct answers allowed
      onUpdate({
        options: block.options?.map(opt =>
          opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
        ),
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
            {IconComponent && <IconComponent className={cn('w-4 h-4', config.color)} />}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{config.labelRu}</h3>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onDelete}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Content field - for most blocks */}
        {['heading', 'text', 'image_text', 'single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'slider', 'hotspot'].includes(block.type) && (
          <div className="space-y-2">
            <Label>
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
                className="text-lg font-bold"
              />
            ) : (
              <Textarea
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Введите текст..."
                rows={block.type === 'text' ? 6 : 3}
              />
            )}
          </div>
        )}

        {/* Image upload */}
        {['image', 'image_text', 'hotspot'].includes(block.type) && (
          <div className="space-y-2">
            <Label>Изображение</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
              {block.imageUrl ? (
                <div className="relative">
                  <img src={block.imageUrl} alt="" className="w-full rounded-lg" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => onUpdate({ imageUrl: undefined })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="py-8">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Перетащите изображение или нажмите для загрузки
                  </p>
                  <Input
                    type="text"
                    placeholder="Или вставьте URL изображения..."
                    className="mt-3 max-w-xs mx-auto"
                    onChange={(e) => onUpdate({ imageUrl: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video URL */}
        {block.type === 'video' && (
          <div className="space-y-2">
            <Label>URL видео</Label>
            <Input
              value={block.videoUrl || ''}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        )}

        {/* Audio URL */}
        {block.type === 'audio' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={block.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Название трека..."
              />
            </div>
            <div className="space-y-2">
              <Label>URL аудио</Label>
              <Input
                value={block.audioUrl || ''}
                onChange={(e) => onUpdate({ audioUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        )}

        {/* Options for quiz types */}
        {['single_choice', 'multiple_choice'].includes(block.type) && (
          <div className="space-y-2">
            <Label>Варианты ответа</Label>
            <div className="space-y-2">
              {(block.options || []).map((option, idx) => (
                <div key={option.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCorrectOption(option.id)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      option.isCorrect
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-border hover:border-green-500'
                    )}
                  >
                    {option.isCorrect && <span className="text-xs">✓</span>}
                  </button>
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(option.id, { text: e.target.value })}
                    placeholder={`Вариант ${idx + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteOption(option.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="soft" size="sm" onClick={addOption}>
              <Plus className="w-4 h-4 mr-1" />
              Добавить вариант
            </Button>
          </div>
        )}

        {/* True/False toggle */}
        {block.type === 'true_false' && (
          <div className="space-y-2">
            <Label>Правильный ответ</Label>
            <div className="flex items-center gap-4">
              <Button
                variant={block.correctAnswer === true ? 'default' : 'outline'}
                onClick={() => onUpdate({ correctAnswer: true })}
              >
                Да
              </Button>
              <Button
                variant={block.correctAnswer === false ? 'default' : 'outline'}
                onClick={() => onUpdate({ correctAnswer: false })}
              >
                Нет
              </Button>
            </div>
          </div>
        )}

        {/* Fill blank word */}
        {block.type === 'fill_blank' && (
          <div className="space-y-2">
            <Label>Правильное слово</Label>
            <Input
              value={block.blankWord || ''}
              onChange={(e) => onUpdate({ blankWord: e.target.value })}
              placeholder="Слово для пропуска..."
            />
          </div>
        )}

        {/* Slider settings */}
        {block.type === 'slider' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Мин</Label>
                <Input
                  type="number"
                  value={block.sliderMin || 0}
                  onChange={(e) => onUpdate({ sliderMin: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Макс</Label>
                <Input
                  type="number"
                  value={block.sliderMax || 100}
                  onChange={(e) => onUpdate({ sliderMax: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Шаг</Label>
                <Input
                  type="number"
                  value={block.sliderStep || 1}
                  onChange={(e) => onUpdate({ sliderStep: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Правильный ответ</Label>
              <Input
                type="number"
                value={block.sliderCorrect || 50}
                onChange={(e) => onUpdate({ sliderCorrect: Number(e.target.value) })}
              />
            </div>
          </div>
        )}

        {/* Matching pairs */}
        {block.type === 'matching' && (
          <div className="space-y-2">
            <Label>Пары</Label>
            <div className="space-y-2">
              {(block.matchingPairs || []).map((pair, idx) => (
                <div key={pair.id} className="flex items-center gap-2">
                  <Input
                    value={pair.left}
                    onChange={(e) => onUpdate({
                      matchingPairs: block.matchingPairs?.map(p =>
                        p.id === pair.id ? { ...p, left: e.target.value } : p
                      ),
                    })}
                    placeholder="Левый"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">→</span>
                  <Input
                    value={pair.right}
                    onChange={(e) => onUpdate({
                      matchingPairs: block.matchingPairs?.map(p =>
                        p.id === pair.id ? { ...p, right: e.target.value } : p
                      ),
                    })}
                    placeholder="Правый"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onUpdate({
                      matchingPairs: block.matchingPairs?.filter(p => p.id !== pair.id),
                    })}
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
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить пару
            </Button>
          </div>
        )}

        {/* Ordering items */}
        {block.type === 'ordering' && (
          <div className="space-y-2">
            <Label>Пункты (в правильном порядке)</Label>
            <div className="space-y-2">
              {(block.orderingItems || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
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
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      const newItems = block.orderingItems?.filter((_, i) => i !== idx);
                      onUpdate({ orderingItems: newItems, correctOrder: newItems });
                    }}
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
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить пункт
            </Button>
          </div>
        )}

        {/* Explanation field - for quiz types */}
        {['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'slider', 'hotspot'].includes(block.type) && (
          <div className="space-y-2">
            <Label>Объяснение (показывается после ответа)</Label>
            <Textarea
              value={block.explanation || ''}
              onChange={(e) => onUpdate({ explanation: e.target.value })}
              placeholder="Почему это правильный ответ..."
              rows={2}
            />
          </div>
        )}
      </div>

      {/* AI Actions */}
      <div className="px-4 py-3 border-t border-border bg-muted/30">
        <Button variant="soft-ai" size="sm" className="w-full">
          <Sparkles className="w-4 h-4 mr-2" />
          Улучшить с AI
        </Button>
      </div>
    </div>
  );
};
