import React from 'react';
import { SubBlock, SubBlockType, SUB_BLOCK_CONFIGS, TextHighlightType, DividerStyleType, BadgeItem } from '@/types/designBlock';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { BadgeEditor } from './BadgeEditor';
import { TableEditor } from './TableEditor';
import { useTextEditor } from './TextEditorContext';
import { SubBlockAIChat } from './SubBlockAIChat';
import {
  Heading, Type, Image, MousePointerClick, Minus, Plus, Sparkles, Tag, Play,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Underline, Waves, Bold, Italic,
  ChevronLeft,
  // Icons for icon selector
  Star, Heart, CheckCircle, XCircle, AlertCircle,
  Zap, Target, Trophy, Gift, Crown,
  Flame, Rocket, Lightbulb, ThumbsUp, ThumbsDown,
  Eye, Music, Camera, Book, Bookmark
} from 'lucide-react';

const subBlockIconMap = {
  Heading, Type, Image, MousePointerClick, Minus, Sparkles, Tag, Play, Table: Heading
};

// 20 universal icons for sub-block selection
const ICON_OPTIONS = [
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'CheckCircle', icon: CheckCircle },
  { name: 'XCircle', icon: XCircle },
  { name: 'AlertCircle', icon: AlertCircle },
  { name: 'Zap', icon: Zap },
  { name: 'Target', icon: Target },
  { name: 'Trophy', icon: Trophy },
  { name: 'Gift', icon: Gift },
  { name: 'Crown', icon: Crown },
  { name: 'Flame', icon: Flame },
  { name: 'Rocket', icon: Rocket },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'ThumbsUp', icon: ThumbsUp },
  { name: 'ThumbsDown', icon: ThumbsDown },
  { name: 'Eye', icon: Eye },
  { name: 'Music', icon: Music },
  { name: 'Camera', icon: Camera },
  { name: 'Book', icon: Book },
];

interface SubBlockSettingsEditorProps {
  subBlock: SubBlock;
  onUpdate: (updates: Partial<SubBlock>) => void;
  onClose: () => void;
  onReplaceAllBlocks?: (blocks: Partial<SubBlock>[]) => void;
}

export const SubBlockSettingsEditor: React.FC<SubBlockSettingsEditorProps> = ({
  subBlock,
  onUpdate,
  onClose,
  onReplaceAllBlocks,
}) => {
  const config = SUB_BLOCK_CONFIGS[subBlock.type];
  const IconComponent = subBlockIconMap[config.icon as keyof typeof subBlockIconMap];
  const { activeEditor } = useTextEditor();

  // Text formatting toolbar component
  const TextFormattingToolbar = () => {
    if (!activeEditor) {
      return (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground">
            💡 Кликните на текст слева, чтобы активировать форматирование
          </p>
        </div>
      );
    }

    const formatButtons = [
      {
        icon: Bold,
        label: 'Жирный',
        action: () => activeEditor.chain().focus().toggleBold().run(),
        isActive: activeEditor.isActive('bold'),
      },
      {
        icon: Italic,
        label: 'Курсив',
        action: () => activeEditor.chain().focus().toggleItalic().run(),
        isActive: activeEditor.isActive('italic'),
      },
      {
        icon: Highlighter,
        label: 'Маркер',
        action: () => activeEditor.chain().focus().toggleHighlight().run(),
        isActive: activeEditor.isActive('highlight'),
      },
      {
        icon: Underline,
        label: 'Подчёркивание',
        action: () => activeEditor.chain().focus().toggleUnderline().run(),
        isActive: activeEditor.isActive('underline'),
      },
      {
        icon: Waves,
        label: 'Волна',
        action: () => activeEditor.chain().focus().toggleWavyUnderline().run(),
        isActive: activeEditor.isActive('wavyUnderline'),
      },
    ];

    return (
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Форматирование</Label>
        <div className="flex gap-1">
          {formatButtons.map(({ icon: Icon, label, action, isActive }) => (
            <button
              key={label}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                action();
              }}
              className={cn(
                "flex-1 p-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
              title={label}
            >
              <Icon className="w-4 h-4 mx-auto" />
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Выделите текст слева и нажмите кнопку
        </p>
      </div>
    );
  };

  // Alignment selector with optional justify option
  const renderAlignmentSelector = (includeJustify = true) => (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Выравнивание</Label>
      <div className="flex gap-1">
        {[
          { value: 'left', icon: AlignLeft, label: 'Слева' },
          { value: 'center', icon: AlignCenter, label: 'По центру' },
          { value: 'right', icon: AlignRight, label: 'Справа' },
          ...(includeJustify ? [{ value: 'justify', icon: AlignJustify, label: 'По ширине' }] : []),
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => onUpdate({ textAlign: value as 'left' | 'center' | 'right' | 'justify' })}
            className={cn(
              "flex-1 p-2 rounded-lg transition-colors",
              (subBlock.textAlign === value || (!subBlock.textAlign && value === 'center'))
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

  // Text size selector - can specify which sizes to show
  const renderTextSizeSelector = (sizes: Array<'small' | 'medium' | 'large' | 'xlarge'> = ['small', 'medium', 'large', 'xlarge']) => {
    const sizeLabels = { small: 'S', medium: 'M', large: 'L', xlarge: 'XL' };
    return (
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Размер текста</Label>
        <div className="flex gap-1">
          {sizes.map((value) => (
            <button
              key={value}
              onClick={() => onUpdate({ textSize: value })}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors",
                subBlock.textSize === value 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {sizeLabels[value]}
            </button>
          ))}
        </div>
      </div>
    );
  };

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

  const renderBackdropSelector = () => {
    const backdropOptions = [
      { value: 'none', label: 'Нет' },
      { value: 'light', label: 'Светлая' },
      { value: 'dark', label: 'Тёмная' },
      { value: 'primary', label: 'Акцент' },
      { value: 'blur', label: 'Блюр' },
    ];

    return (
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground">Подложка</Label>
        <div className="grid grid-cols-5 gap-1">
          {backdropOptions.map(({ value, label }) => (
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
        
        {/* Visual preview of all backdrops */}
        <div className="grid grid-cols-5 gap-1.5">
          {backdropOptions.map(({ value }) => {
            const previewStyles: React.CSSProperties = {
              none: {},
              light: { backgroundColor: 'hsl(var(--muted))' },
              dark: { backgroundColor: 'hsl(var(--foreground))' },
              primary: { backgroundColor: 'hsl(var(--primary))' },
              blur: { backgroundColor: 'hsl(var(--muted) / 0.6)', backdropFilter: 'blur(4px)' },
            }[value] || {};
            
            const isSelected = subBlock.backdrop === value || (!subBlock.backdrop && value === 'none');
            
            return (
              <button
                key={value}
                onClick={() => onUpdate({ backdrop: value as 'none' | 'light' | 'dark' | 'primary' | 'blur' })}
                className={cn(
                  "h-10 rounded-lg border-2 transition-all",
                  isSelected ? "border-primary" : "border-transparent hover:border-border"
                )}
                style={previewStyles}
              >
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ 
                    color: value === 'dark' ? 'white' : value === 'primary' ? 'white' : 'hsl(var(--foreground))'
                  }}
                >
                  <span className="text-[8px] font-medium opacity-60">Aa</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

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
          { value: 'square', label: 'Квадрат' },
          { value: 'oval', label: 'Овал' },
          { value: 'contrast', label: 'Контраст' },
          { value: 'pastel', label: 'Пастель' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onUpdate({ badgeVariant: value as 'square' | 'oval' | 'contrast' | 'pastel' })}
            className={cn(
              "py-2 px-3 rounded-lg text-sm transition-colors",
              (subBlock.badgeVariant === value || (!subBlock.badgeVariant && value === 'oval'))
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

  const renderBadgeSizeSelector = () => (
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
            onClick={() => onUpdate({ badgeSize: value as 'small' | 'medium' | 'large' })}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors",
              (subBlock.badgeSize === value || (!subBlock.badgeSize && value === 'medium'))
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
                  style={{ width: `${Math.max(0, 100 - ((subBlock.content || '').length / 45) * 100)}%` }}
                />
              </div>
            </div>
            {renderAlignmentSelector(false)}
            {renderTextSizeSelector(['large', 'xlarge'])}
          </>
        )}

        {/* Text settings */}
        {subBlock.type === 'text' && (
          <>
            {renderAlignmentSelector(false)}
            {renderTextSizeSelector()}
            {renderBackdropSelector()}
            
            {/* Text formatting toolbar */}
            <TextFormattingToolbar />
            
            {/* Text rotation - slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Наклон</Label>
                <span className="text-xs font-medium">
                  {(subBlock.textRotation || 0) > 0 ? `+${subBlock.textRotation}°` : `${subBlock.textRotation || 0}°`}
                </span>
              </div>
              <Slider
                value={[subBlock.textRotation || 0]}
                onValueChange={(value) => onUpdate({ textRotation: value[0] })}
                min={-5}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>-5°</span>
                <span>0°</span>
                <span>+5°</span>
              </div>
            </div>
          </>
        )}

        {/* Image settings */}
        {subBlock.type === 'image' && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Поворот</Label>
                <span className="text-xs font-medium">
                  {(subBlock.imageRotation || 0) > 0 ? `+${subBlock.imageRotation}°` : `${subBlock.imageRotation || 0}°`}
                </span>
              </div>
              <Slider
                value={[subBlock.imageRotation || 0]}
                onValueChange={(value) => onUpdate({ imageRotation: value[0] })}
                min={-5}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>-5°</span>
                <span>0°</span>
                <span>+5°</span>
              </div>
            </div>
          </>
        )}

        {/* Button settings */}
        {subBlock.type === 'button' && (
          <>
            {renderAlignmentSelector(false)}
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


        {/* Badge settings */}
        {subBlock.type === 'badge' && (
          <>
            {renderAlignmentSelector(false)}
            {renderBadgeSizeSelector()}
            {renderBadgeVariantSelector()}
            
            {/* Multiple badges editor */}
            <BadgeEditor
              badges={subBlock.badges || [{ id: crypto.randomUUID(), text: subBlock.badgeText || 'Бейдж', iconType: 'none' }]}
              layout={subBlock.badgeLayout || 'horizontal'}
              onBadgesChange={(badges) => onUpdate({ badges })}
              onLayoutChange={(badgeLayout) => onUpdate({ badgeLayout })}
            />
          </>
        )}

        {/* Animation settings */}
        {subBlock.type === 'animation' && (
          <>
            {renderAlignmentSelector()}
            
            {/* Animation format selector */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Формат анимации</Label>
              <div className="flex gap-1">
                {[
                  { value: 'lottie', label: 'Lottie (.json)' },
                  { value: 'rive', label: 'Rive (.riv)' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onUpdate({ animationType: value as 'lottie' | 'rive' })}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs transition-colors",
                      (subBlock.animationType === value || (!subBlock.animationType && value === 'lottie'))
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Animation file upload */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Файл анимации</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept={subBlock.animationType === 'rive' ? '.riv' : '.json'}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          onUpdate({ animationUrl: event.target?.result as string });
                        };
                        if (subBlock.animationType === 'rive') {
                          reader.readAsDataURL(file);
                        } else {
                          reader.readAsText(file);
                        }
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {subBlock.animationUrl ? 'Заменить файл' : 'Загрузить файл'}
                  </span>
                </label>
                {subBlock.animationUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => onUpdate({ animationUrl: undefined })}
                  >
                    Удалить анимацию
                  </Button>
                )}
              </div>
            </div>

            {/* Size selector */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Размер</Label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { value: 'small', label: 'S' },
                  { value: 'medium', label: 'M' },
                  { value: 'large', label: 'L' },
                  { value: 'full', label: '100%' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onUpdate({ animationSize: value as 'small' | 'medium' | 'large' | 'full' })}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-xs transition-colors",
                      (subBlock.animationSize === value || (!subBlock.animationSize && value === 'medium'))
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

        {/* Table settings */}
        {subBlock.type === 'table' && (
          <>
            {renderAlignmentSelector(false)}
            
            {/* Table style */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Стиль таблицы</Label>
              <div className="flex gap-1">
                {[
                  { value: 'simple', label: 'Простой' },
                  { value: 'striped', label: 'Полосы' },
                  { value: 'bordered', label: 'Рамки' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onUpdate({ tableStyle: value as 'simple' | 'striped' | 'bordered' })}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg text-xs transition-colors",
                      (subBlock.tableStyle === value || (!subBlock.tableStyle && value === 'simple'))
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table text size */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Размер текста</Label>
              <div className="flex gap-1">
                {[
                  { value: 'small', label: 'S' },
                  { value: 'medium', label: 'M' },
                  { value: 'large', label: 'L' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onUpdate({ tableTextSize: value as 'small' | 'medium' | 'large' })}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors",
                      (subBlock.tableTextSize === value || (!subBlock.tableTextSize && value === 'medium'))
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row/column controls */}
            <div className="space-y-3">
              {/* Row controls */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Строки: {(subBlock.tableData || [[]]).length}/5
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const data = subBlock.tableData || [[{ id: '1', content: '' }]];
                      if (data.length <= 1) return;
                      onUpdate({ tableData: data.slice(0, -1) });
                    }}
                    disabled={(subBlock.tableData || [[]]).length <= 1}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const data = subBlock.tableData || [[{ id: '1', content: '' }]];
                      if (data.length >= 5) return;
                      const cols = data[0]?.length || 2;
                      const newRow = Array.from({ length: cols }, () => ({
                        id: crypto.randomUUID(),
                        content: '',
                      }));
                      onUpdate({ tableData: [...data, newRow] });
                    }}
                    disabled={(subBlock.tableData || [[]]).length >= 5}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Column controls */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Столбцы: {(subBlock.tableData?.[0] || []).length}/4
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const data = subBlock.tableData || [[{ id: '1', content: '' }]];
                      if ((data[0]?.length || 1) <= 1) return;
                      const newData = data.map(row => row.slice(0, -1));
                      onUpdate({ tableData: newData });
                    }}
                    disabled={(subBlock.tableData?.[0] || []).length <= 1}
                    className="h-7 w-7 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const data = subBlock.tableData || [[{ id: '1', content: '' }]];
                      if ((data[0]?.length || 1) >= 4) return;
                      const newData = data.map(row => [
                        ...row,
                        { id: crypto.randomUUID(), content: '' },
                      ]);
                      onUpdate({ tableData: newData });
                    }}
                    disabled={(subBlock.tableData?.[0] || []).length >= 4}
                    className="h-7 w-7 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
