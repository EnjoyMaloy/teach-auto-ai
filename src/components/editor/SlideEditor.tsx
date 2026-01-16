import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  Type, Image, CheckCircle2, ListChecks, ToggleLeft, PenLine,
  Sparkles, ArrowDown, ArrowUp, Plus,
  Wand2, Lightbulb, ChevronDown, Layers
} from 'lucide-react';
import { Slide, SlideType } from '@/types/course';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SortableSlideItem } from './SortableSlideItem';

interface SlideEditorProps {
  slides: Slide[];
  selectedSlideId: string | null;
  onSelectSlide: (slideId: string) => void;
  onUpdateSlide: (slideId: string, updates: Partial<Slide>) => void;
  onAddSlide: (type: SlideType) => void;
  onDeleteSlide: (slideId: string) => void;
  onImproveSlide: (slideId: string, action: 'improve' | 'simplify' | 'harder') => void;
  onReorderSlides: (activeId: string, overId: string) => void;
}

const slideTypeConfig: Record<SlideType, { icon: React.ElementType; label: string; color: string }> = {
  heading: { icon: Type, label: 'Заголовок', color: 'bg-slate-100 text-slate-600' },
  text: { icon: Type, label: 'Текст', color: 'bg-blue-100 text-blue-600' },
  image: { icon: Image, label: 'Картинка', color: 'bg-purple-100 text-purple-600' },
  video: { icon: Image, label: 'Видео', color: 'bg-red-100 text-red-600' },
  audio: { icon: Type, label: 'Аудио', color: 'bg-amber-100 text-amber-600' },
  image_text: { icon: Image, label: 'Картинка+Текст', color: 'bg-indigo-100 text-indigo-600' },
  design: { icon: Layers, label: 'Дизайн', color: 'bg-fuchsia-100 text-fuchsia-600' },
  single_choice: { icon: CheckCircle2, label: 'Один ответ', color: 'bg-green-100 text-green-600' },
  multiple_choice: { icon: ListChecks, label: 'Несколько', color: 'bg-orange-100 text-orange-600' },
  true_false: { icon: ToggleLeft, label: 'Да/Нет', color: 'bg-yellow-100 text-yellow-600' },
  fill_blank: { icon: PenLine, label: 'Заполни', color: 'bg-pink-100 text-pink-600' },
  matching: { icon: Type, label: 'Соответствие', color: 'bg-cyan-100 text-cyan-600' },
  ordering: { icon: Type, label: 'Порядок', color: 'bg-orange-100 text-orange-600' },
  slider: { icon: Type, label: 'Ползунок', color: 'bg-violet-100 text-violet-600' },
  hotspot: { icon: Image, label: 'Точки', color: 'bg-rose-100 text-rose-600' },
};

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slides,
  selectedSlideId,
  onSelectSlide,
  onUpdateSlide,
  onAddSlide,
  onDeleteSlide,
  onImproveSlide,
  onReorderSlides,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const selectedSlide = slides.find(s => s.id === selectedSlideId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderSlides(active.id as string, over.id as string);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground">Слайды</h3>
        <div className="relative">
          <Button 
            variant="soft" 
            size="sm"
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Добавить
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
          
          {showAddMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-popover rounded-xl shadow-lg border border-border p-2 z-10 animate-scale-in">
              {(Object.keys(slideTypeConfig) as SlideType[]).map(type => {
                const config = slideTypeConfig[type];
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      onAddSlide(type);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', config.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Slides List */}
      <div className="flex-1 overflow-y-auto p-3">
        {slides.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slides.map(s => s.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-3">
                {slides.map((slide, index) => (
                  <SortableSlideItem
                    key={slide.id}
                    slide={slide}
                    index={index}
                    isSelected={selectedSlideId === slide.id}
                    onSelect={() => onSelectSlide(slide.id)}
                    onDelete={() => onDeleteSlide(slide.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Type className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">Добавьте первый слайд</p>
            <Button variant="soft" onClick={() => onAddSlide('text')}>
              <Plus className="w-4 h-4 mr-2" />
              Текстовый слайд
            </Button>
          </div>
        )}
      </div>

      {/* Selected Slide Editor */}
      {selectedSlide && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-ai" />
            <span className="text-sm font-medium">AI-действия</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="soft-ai"
              size="sm"
              onClick={() => onImproveSlide(selectedSlide.id, 'improve')}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Улучшить
            </Button>
            <Button
              variant="soft"
              size="sm"
              onClick={() => onImproveSlide(selectedSlide.id, 'simplify')}
            >
              <ArrowDown className="w-3.5 h-3.5 mr-1" />
              Проще
            </Button>
            <Button
              variant="soft"
              size="sm"
              onClick={() => onImproveSlide(selectedSlide.id, 'harder')}
            >
              <ArrowUp className="w-3.5 h-3.5 mr-1" />
              Сложнее
            </Button>
          </div>

          {/* Content editor */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Контент
            </label>
            <textarea
              value={selectedSlide.content}
              onChange={(e) => onUpdateSlide(selectedSlide.id, { content: e.target.value })}
              className="w-full h-24 px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Введите текст слайда..."
            />
          </div>

          {selectedSlide.explanation !== undefined && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Объяснение ответа
              </label>
              <input
                type="text"
                value={selectedSlide.explanation || ''}
                onChange={(e) => onUpdateSlide(selectedSlide.id, { explanation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Почему это правильный ответ..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
