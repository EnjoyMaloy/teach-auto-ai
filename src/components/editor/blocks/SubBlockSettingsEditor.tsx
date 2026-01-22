import React from 'react';
import { SubBlock, SubBlockType, SUB_BLOCK_CONFIGS, TextHighlightType, DividerStyleType } from '@/types/designBlock';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Heading, Type, Image, MousePointerClick, Minus, Sparkles, Tag, Play,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, Underline, Waves,
  ChevronLeft
} from 'lucide-react';

const subBlockIconMap = {
  Heading, Type, Image, MousePointerClick, Minus, Sparkles, Tag, Play
};

interface SubBlockSettingsEditorProps {
  subBlock: SubBlock;
  onUpdate: (updates: Partial<SubBlock>) => void;
  onClose: () => void;
}

export const SubBlockSettingsEditor: React.FC<SubBlockSettingsEditorProps> = ({
  subBlock,
  onUpdate,
  onClose,
}) => {
  const config = SUB_BLOCK_CONFIGS[subBlock.type];
  const IconComponent = subBlockIconMap[config.icon as keyof typeof subBlockIconMap];

  const renderAlignmentSelector = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Выравнивание</Label>
      <div className="flex gap-1">
        {[
          { value: 'left', icon: AlignLeft, label: 'Слева' },
          { value: 'center', icon: AlignCenter, label: 'По центру' },
          { value: 'right', icon: AlignRight, label: 'Справа' },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => onUpdate({ textAlign: value as 'left' | 'center' | 'right' })}
            className={cn(
              "flex-1 p-2 rounded-lg transition-colors",
              subBlock.textAlign === value 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
            title={label}
          >
            <Icon className="w-4 h-4 mx-auto" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderTextSizeSelector = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Размер текста</Label>
      <div className="flex gap-1">
        {[
          { value: 'small', label: 'S' },
          { value: 'medium', label: 'M' },
          { value: 'large', label: 'L' },
          { value: 'xlarge', label: 'XL' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onUpdate({ textSize: value as 'small' | 'medium' | 'large' | 'xlarge' })}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors",
              subBlock.textSize === value 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderHighlightSelector = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Выделение текста</Label>
      <div className="flex gap-1">
        {[
          { value: 'none', label: 'Нет' },
          { value: 'marker', label: 'Маркер', icon: Highlighter },
          { value: 'underline', label: 'Подчёркивание', icon: Underline },
          { value: 'wavy', label: 'Волна', icon: Waves },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onUpdate({ highlight: value as TextHighlightType })}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1",
              subBlock.highlight === value 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
            title={label}
          >
            {Icon ? <Icon className="w-3.5 h-3.5" /> : label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBackdropSelector = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Подложка</Label>
      <div className="grid grid-cols-5 gap-1">
        {[
          { value: 'none', label: 'Нет' },
          { value: 'light', label: 'Светлая' },
          { value: 'dark', label: 'Тёмная' },
          { value: 'primary', label: 'Акцент' },
          { value: 'blur', label: 'Блюр' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onUpdate({ backdrop: value as 'none' | 'light' | 'dark' | 'primary' | 'blur' })}
            className={cn(
              "py-1.5 px-1 rounded-lg text-xs transition-colors",
              subBlock.backdrop === value 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderDividerStyleSelector = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Стиль разделителя</Label>
      <div className="grid grid-cols-2 gap-1">
        {[
          { value: 'thin', label: 'Тонкий' },
          { value: 'medium', label: 'Средний' },
          { value: 'bold', label: 'Жирный' },
          { value: 'dashed', label: 'Прерывистый' },
          { value: 'dotted', label: 'Точечный' },
          { value: 'wavy', label: 'Волнистый' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onUpdate({ dividerStyle: value as DividerStyleType })}
            className={cn(
              "py-2 px-3 rounded-lg text-sm transition-colors",
              subBlock.dividerStyle === value 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderButtonVariantSelector = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Стиль кнопки</Label>
      <div className="grid grid-cols-2 gap-1">
        {[
          { value: 'primary', label: 'Основная' },
          { value: 'secondary', label: 'Вторичная' },
          { value: 'outline', label: 'Контур' },
          { value: 'ghost', label: 'Прозрачная' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onUpdate({ buttonVariant: value as 'primary' | 'secondary' | 'outline' | 'ghost' })}
            className={cn(
              "py-2 px-3 rounded-lg text-sm transition-colors",
              subBlock.buttonVariant === value 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBadgeVariantSelector = () => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Стиль бейджа</Label>
      <div className="grid grid-cols-2 gap-1">
        {[
          { value: 'default', label: 'Обычный' },
          { value: 'success', label: 'Успех' },
          { value: 'warning', label: 'Внимание' },
          { value: 'destructive', label: 'Ошибка' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onUpdate({ badgeVariant: value as 'default' | 'success' | 'warning' | 'destructive' })}
            className={cn(
              "py-2 px-3 rounded-lg text-sm transition-colors",
              subBlock.badgeVariant === value 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            {IconComponent && <IconComponent className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-medium">{config.labelRu}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Settings based on sub-block type */}
      <div className="space-y-4">
        {/* Heading settings */}
        {subBlock.type === 'heading' && (
          <>
            {/* Character counter */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Символов осталось</span>
                <span className={cn(
                  "text-lg font-semibold tabular-nums",
                  (45 - (subBlock.content || '').length) <= 5 
                    ? "text-destructive" 
                    : (45 - (subBlock.content || '').length) <= 15 
                      ? "text-orange-500" 
                      : "text-primary"
                )}>
                  {45 - (subBlock.content || '').length}
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-150 rounded-full",
                    (45 - (subBlock.content || '').length) <= 5 
                      ? "bg-destructive" 
                      : (45 - (subBlock.content || '').length) <= 15 
                        ? "bg-orange-500" 
                        : "bg-primary"
                  )}
                  style={{ width: `${Math.max(0, ((subBlock.content || '').length / 45) * 100)}%` }}
                />
              </div>
            </div>
            {renderAlignmentSelector()}
            {renderTextSizeSelector()}
          </>
        )}

        {/* Text settings */}
        {subBlock.type === 'text' && (
          <>
            {renderAlignmentSelector()}
            {renderTextSizeSelector()}
            {renderBackdropSelector()}
          </>
        )}

        {/* Image settings */}
        {subBlock.type === 'image' && (
          <>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Поворот</Label>
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdate({ imageRotation: (subBlock.imageRotation || 0) - 15 })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm transition-colors",
                    "bg-muted hover:bg-muted/80"
                  )}
                >
                  ↺ −15°
                </button>
                <button
                  onClick={() => onUpdate({ imageRotation: 0 })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm transition-colors",
                    subBlock.imageRotation === 0 || !subBlock.imageRotation
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  0°
                </button>
                <button
                  onClick={() => onUpdate({ imageRotation: (subBlock.imageRotation || 0) + 15 })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm transition-colors",
                    "bg-muted hover:bg-muted/80"
                  )}
                >
                  +15° ↻
                </button>
              </div>
              {subBlock.imageRotation !== 0 && subBlock.imageRotation && (
                <p className="text-xs text-muted-foreground text-center">
                  Текущий угол: {subBlock.imageRotation}°
                </p>
              )}
            </div>
          </>
        )}

        {/* Button settings */}
        {subBlock.type === 'button' && (
          <>
            {renderAlignmentSelector()}
            {renderButtonVariantSelector()}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Ссылка</Label>
              <Input
                value={subBlock.buttonUrl || ''}
                onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
                placeholder="https://example.com"
                className="rounded-lg"
              />
            </div>
          </>
        )}

        {/* Divider settings */}
        {subBlock.type === 'divider' && (
          <>
            {renderDividerStyleSelector()}
          </>
        )}

        {/* Icon settings */}
        {subBlock.type === 'icon' && (
          <>
            {renderAlignmentSelector()}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Размер</Label>
              <div className="flex gap-1">
                {[
                  { value: 'small', label: 'S' },
                  { value: 'medium', label: 'M' },
                  { value: 'large', label: 'L' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onUpdate({ iconSize: value as 'small' | 'medium' | 'large' })}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors",
                      subBlock.iconSize === value 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Badge settings */}
        {subBlock.type === 'badge' && (
          <>
            {renderAlignmentSelector()}
            {renderBadgeVariantSelector()}
          </>
        )}

        {/* Animation settings */}
        {subBlock.type === 'animation' && (
          <>
            {renderAlignmentSelector()}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Размер</Label>
              <div className="flex gap-1">
                {[
                  { value: 'small', label: 'S' },
                  { value: 'medium', label: 'M' },
                  { value: 'large', label: 'L' },
                  { value: 'full', label: 'Во всю ширину' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onUpdate({ animationSize: value as 'small' | 'medium' | 'large' | 'full' })}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg text-xs transition-colors",
                      subBlock.animationSize === value 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
