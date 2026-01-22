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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { 
  SubBlock, 
  SubBlockType, 
  SUB_BLOCK_CONFIGS, 
  DESIGN_TEMPLATES, 
  createSubBlock,
  createSubBlocksFromTemplate,
  DesignTemplateId,
  TextHighlightType,
  DividerStyleType
} from '@/types/designBlock';
import { DEFAULT_DESIGN_BLOCK_SETTINGS } from '@/types/designSystem';
import { CourseDesignSystem } from '@/types/course';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from './RichTextEditor';
import {
  Plus, Trash2, GripVertical, Upload,
  Heading, Type, Image, MousePointerClick, Minus, Sparkles, Tag, Layers, Play,
  Link, ExternalLink
} from 'lucide-react';
import { AnimationBlock } from './AnimationBlock';

const iconMap = {
  Heading, Type, Image, MousePointerClick, Minus, Sparkles, Tag, Layers, Play
};

interface DesignBlockEditorProps {
  subBlocks: SubBlock[];
  onUpdateSubBlocks: (subBlocks: SubBlock[]) => void;
  designSystem?: CourseDesignSystem;
  isEditing?: boolean;
  selectedSubBlockId?: string | null;
  onSelectSubBlock?: (id: string | null) => void;
}

// Sortable sub-block item for the preview
const SortableSubBlockItem: React.FC<{
  subBlock: SubBlock;
  isEditing: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate: (updates: Partial<SubBlock>) => void;
  onDelete: () => void;
  designSystem?: CourseDesignSystem;
}> = ({ subBlock, isEditing, isSelected, onSelect, onUpdate, onDelete, designSystem }) => {
  // Component state - always called unconditionally at top level
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [isHeadingFocused, setIsHeadingFocused] = useState(false);
  const [headingCounter, setHeadingCounter] = useState(45 - (subBlock.content || '').length);
  const [isButtonUrlVisible, setIsButtonUrlVisible] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subBlock.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const ds = {
    primaryColor: designSystem?.primaryColor || '262 83% 58%',
    foregroundColor: designSystem?.foregroundColor || '240 10% 4%',
    mutedColor: designSystem?.mutedColor || '240 5% 96%',
    successColor: designSystem?.successColor || '142 71% 45%',
    borderRadius: designSystem?.borderRadius || '0.75rem',
    // Design block backdrop colors from design system
    backdropLightColor: designSystem?.designBlock?.backdropLightColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropLightColor,
    backdropDarkColor: designSystem?.designBlock?.backdropDarkColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropDarkColor,
    backdropPrimaryColor: designSystem?.designBlock?.backdropPrimaryColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropPrimaryColor,
    backdropBlurColor: designSystem?.designBlock?.backdropBlurColor || DEFAULT_DESIGN_BLOCK_SETTINGS.backdropBlurColor,
    // Highlight colors
    highlightMarkerColor: designSystem?.designBlock?.highlightMarkerColor || DEFAULT_DESIGN_BLOCK_SETTINGS.highlightMarkerColor,
    highlightUnderlineColor: designSystem?.designBlock?.highlightUnderlineColor || DEFAULT_DESIGN_BLOCK_SETTINGS.highlightUnderlineColor,
    highlightWavyColor: designSystem?.designBlock?.highlightWavyColor || DEFAULT_DESIGN_BLOCK_SETTINGS.highlightWavyColor,
  };

  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[subBlock.textAlign || 'center'];

  const paddingClass = {
    none: 'p-0',
    small: 'px-2 py-1',
    medium: 'px-4 py-2',
    large: 'px-6 py-4',
  }[subBlock.padding || 'medium'];

  // Get highlight styles for text
  const getHighlightStyles = (highlight?: TextHighlightType): React.CSSProperties => {
    switch (highlight) {
      case 'marker':
        return {
          backgroundColor: `hsl(${ds.highlightMarkerColor})`,
          padding: '0 4px',
          borderRadius: '2px',
        };
      case 'underline':
        return {
          borderBottom: `2px solid hsl(${ds.highlightUnderlineColor})`,
          paddingBottom: '2px',
        };
      case 'wavy':
        return {
          textDecorationLine: 'underline',
          textDecorationStyle: 'wavy',
          textDecorationColor: `hsl(${ds.highlightWavyColor})`,
          textUnderlineOffset: '4px',
        };
      default:
        return {};
    }
  };


  const renderSubBlockContent = () => {
    switch (subBlock.type) {
      case 'heading':
        const headingSizeClass = {
          small: 'text-lg',
          medium: 'text-xl',
          large: 'text-2xl',
          xlarge: 'text-3xl',
        }[subBlock.textSize || 'large'];
        
        const fontWeightClass = {
          normal: 'font-normal',
          medium: 'font-medium',
          semibold: 'font-semibold',
          bold: 'font-bold',
        }[subBlock.fontWeight || 'bold'];

        const headingHighlightStyles = getHighlightStyles(subBlock.highlight);

        // Limit heading to 45 characters
        const MAX_HEADING_CHARS = 45;

        return (
          <div className="w-full">
            <h2 
              className={cn(headingSizeClass, fontWeightClass, textAlignClass, 'break-words whitespace-pre-wrap outline-none')}
              style={{ color: `hsl(${ds.foregroundColor})` }}
              contentEditable={isEditing}
              suppressContentEditableWarning
              onFocus={() => {
                setIsHeadingFocused(true);
                if (onSelect) {
                  onSelect();
                }
              }}
              onBlur={(e) => {
                setIsHeadingFocused(false);
                if (isEditing) {
                  const text = e.currentTarget.textContent || '';
                  const limitedText = text.slice(0, MAX_HEADING_CHARS);
                  onUpdate({ content: limitedText });
                }
              }}
              onInput={(e) => {
                const text = e.currentTarget.textContent || '';
                if (text.length > MAX_HEADING_CHARS) {
                  const sel = window.getSelection();
                  const cursorPos = sel?.anchorOffset || 0;
                  
                  e.currentTarget.textContent = text.slice(0, MAX_HEADING_CHARS);
                  
                  if (e.currentTarget.firstChild) {
                    const range = document.createRange();
                    range.setStart(e.currentTarget.firstChild, Math.min(cursorPos, MAX_HEADING_CHARS));
                    range.collapse(true);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }
                }
                setHeadingCounter(MAX_HEADING_CHARS - (e.currentTarget.textContent || '').length);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {subBlock.content || 'Заголовок'}
            </h2>
          </div>
        );

      case 'text':
        const textSizeClass = {
          small: 'text-sm',
          medium: 'text-base',
          large: 'text-lg',
          xlarge: 'text-xl',
        }[subBlock.textSize || 'medium'];

        // Backdrop styles from design system
        const backdropStyles = {
          none: {},
          light: { 
            backgroundColor: `hsl(${ds.backdropLightColor})`,
            padding: '12px 16px',
            borderRadius: subBlock.backdropRounded !== false ? '12px' : '0',
          },
          dark: { 
            backgroundColor: `hsl(${ds.backdropDarkColor})`,
            padding: '12px 16px',
            borderRadius: subBlock.backdropRounded !== false ? '12px' : '0',
          },
          primary: { 
            backgroundColor: `hsl(${ds.backdropPrimaryColor})`,
            padding: '12px 16px',
            borderRadius: subBlock.backdropRounded !== false ? '12px' : '0',
          },
          blur: { 
            backgroundColor: `hsl(${ds.backdropBlurColor})`,
            backdropFilter: 'blur(8px)',
            padding: '12px 16px',
            borderRadius: subBlock.backdropRounded !== false ? '12px' : '0',
          },
        }[subBlock.backdrop || 'none'];

        const textColor = subBlock.backdrop === 'dark' 
          ? 'hsl(0 0% 100%)' 
          : `hsl(${ds.foregroundColor} / 0.8)`;

        return (
          <div style={backdropStyles as React.CSSProperties}>
            <RichTextEditor
              content={subBlock.content || (isEditing ? '' : 'Текст абзаца')}
              onChange={(content) => onUpdate({ content })}
              placeholder="Текст абзаца..."
              textSize={subBlock.textSize || 'medium'}
              textAlign={subBlock.textAlign || 'center'}
              textColor={textColor}
              highlightColor={ds.highlightMarkerColor}
              underlineColor={ds.highlightUnderlineColor}
              wavyColor={ds.highlightWavyColor}
              isEditing={isEditing}
              onFocusChange={(focused) => {
                setIsTextFocused(focused);
                if (focused && onSelect) {
                  onSelect();
                }
              }}
            />
          </div>
        );

      case 'image':
        // Image scales to full width (same as text backdrop) with aspect ratio constraints
        // Max height = width (1:1), can be wider up to 10:1
        return (
          <div className="w-full">
            {subBlock.imageUrl ? (
              <div 
                className="w-full rounded-lg overflow-hidden"
                style={{ aspectRatio: 'auto' }}
              >
                <img 
                  src={subBlock.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover object-center"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const parent = img.parentElement;
                    if (parent && img.naturalHeight > img.naturalWidth) {
                      // Portrait image - crop to square (max 1:1 height)
                      parent.style.aspectRatio = '1/1';
                    } else if (parent && img.naturalWidth / img.naturalHeight > 10) {
                      // Ultra-wide image - limit to 10:1
                      parent.style.aspectRatio = '10/1';
                    } else if (parent) {
                      // Normal aspect ratio - use natural
                      parent.style.aspectRatio = `${img.naturalWidth}/${img.naturalHeight}`;
                    }
                  }}
                />
              </div>
            ) : isEditing ? (
              <label 
                className="w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer min-h-[100px] aspect-[3/1]"
                style={{ borderColor: `hsl(${ds.mutedColor})` }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        onUpdate({ imageUrl: event.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Upload className="w-6 h-6 mb-2" style={{ color: `hsl(${ds.foregroundColor} / 0.3)` }} />
                <span className="text-xs" style={{ color: `hsl(${ds.foregroundColor} / 0.3)` }}>Загрузить</span>
              </label>
            ) : (
              <div 
                className="w-full flex items-center justify-center rounded-lg aspect-[3/1] min-h-[60px]"
                style={{ backgroundColor: `hsl(${ds.mutedColor})` }}
              >
                <Image className="w-8 h-8" style={{ color: `hsl(${ds.foregroundColor} / 0.3)` }} />
              </div>
            )}
          </div>
        );

      case 'button':
        const buttonVariantStyles = {
          primary: {
            backgroundColor: `hsl(${ds.primaryColor})`,
            color: 'white',
          },
          secondary: {
            backgroundColor: `hsl(${ds.mutedColor})`,
            color: `hsl(${ds.foregroundColor})`,
          },
          outline: {
            backgroundColor: 'transparent',
            border: `2px solid hsl(${ds.primaryColor})`,
            color: `hsl(${ds.primaryColor})`,
          },
          ghost: {
            backgroundColor: 'transparent',
            color: `hsl(${ds.primaryColor})`,
          },
        }[subBlock.buttonVariant || 'primary'];

        const hasExternalLink = !!subBlock.buttonUrl?.trim();

        const handleButtonClick = () => {
          if (hasExternalLink && !isEditing) {
            window.open(subBlock.buttonUrl, '_blank', 'noopener,noreferrer');
          }
        };

        return (
          <div className={cn('flex flex-col gap-2', textAlignClass === 'text-center' ? 'items-center' : textAlignClass === 'text-right' ? 'items-end' : 'items-start')}>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={subBlock.buttonLabel || ''}
                  onChange={(e) => onUpdate({ buttonLabel: e.target.value })}
                  placeholder="Текст кнопки..."
                  className="px-4 py-2 rounded-lg text-center font-medium outline-none"
                  style={{ ...buttonVariantStyles, borderRadius: ds.borderRadius }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsButtonUrlVisible(true);
                  }}
                  onBlur={(e) => {
                    // Hide URL input if clicking outside both inputs
                    const relatedTarget = e.relatedTarget as HTMLElement;
                    if (!relatedTarget?.closest('.button-url-input')) {
                      setIsButtonUrlVisible(false);
                    }
                  }}
                />
                {isButtonUrlVisible && (
                  <div className="flex items-center gap-2 w-full max-w-[250px] button-url-input">
                    <Link className="w-4 h-4 flex-shrink-0" style={{ color: `hsl(${ds.foregroundColor} / 0.5)` }} />
                    <input
                      type="url"
                      value={subBlock.buttonUrl || ''}
                      onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
                      placeholder="https://example.com"
                      className="flex-1 px-2 py-1 text-sm rounded border outline-none transition-colors duration-200 focus:border-primary"
                      style={{ 
                        borderColor: `hsl(${ds.mutedColor})`,
                        backgroundColor: 'transparent',
                        color: `hsl(${ds.foregroundColor})`,
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget?.closest('.button-url-input') && relatedTarget?.tagName !== 'INPUT') {
                          setIsButtonUrlVisible(false);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                )}
              </>
            ) : (
              <button
                className={cn(
                  "px-4 py-2 rounded-lg font-medium inline-flex items-center gap-1.5",
                  hasExternalLink && "cursor-pointer hover:opacity-90 transition-opacity"
                )}
                style={{ ...buttonVariantStyles, borderRadius: ds.borderRadius }}
                onClick={handleButtonClick}
              >
                {subBlock.buttonLabel || 'Кнопка'}
                {hasExternalLink && <ExternalLink className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        );

      case 'divider':
        const dividerStyle = subBlock.dividerStyle || 'thin';
        
        const dividerStyles: Record<DividerStyleType, React.CSSProperties> = {
          thin: { borderTopWidth: '1px', borderStyle: 'solid' },
          medium: { borderTopWidth: '2px', borderStyle: 'solid' },
          bold: { borderTopWidth: '4px', borderStyle: 'solid' },
          dashed: { borderTopWidth: '2px', borderStyle: 'dashed' },
          dotted: { borderTopWidth: '2px', borderStyle: 'dotted' },
          wavy: {}, // handled separately with SVG
        };

        const dividerOptions: { value: DividerStyleType; label: string }[] = [
          { value: 'thin', label: 'Тонкий' },
          { value: 'medium', label: 'Средний' },
          { value: 'bold', label: 'Жирный' },
          { value: 'dashed', label: 'Прерывистый' },
          { value: 'dotted', label: 'Точечный' },
          { value: 'wavy', label: 'Волнистый' },
        ];

        const renderDivider = () => {
          if (dividerStyle === 'wavy') {
            return (
              <svg 
                width="100%" 
                height="8" 
                viewBox="0 0 100 8" 
                preserveAspectRatio="none"
                style={{ display: 'block' }}
              >
                <path 
                  d="M0 4 Q 5 0, 10 4 T 20 4 T 30 4 T 40 4 T 50 4 T 60 4 T 70 4 T 80 4 T 90 4 T 100 4" 
                  fill="none" 
                  stroke={`hsl(${ds.mutedColor})`}
                  strokeWidth="2"
                />
              </svg>
            );
          }
          return (
            <hr 
              className="w-full border-0"
              style={{ 
                ...dividerStyles[dividerStyle],
                borderColor: `hsl(${ds.mutedColor})`,
              }} 
            />
          );
        };

        return (
          <div className="w-full py-2">
            {renderDivider()}
          </div>
        );

      case 'icon':
        const iconSizeClass = {
          small: 'w-6 h-6',
          medium: 'w-10 h-10',
          large: 'w-16 h-16',
        }[subBlock.iconSize || 'medium'];

        return (
          <div className={cn('flex', textAlignClass === 'text-center' ? 'justify-center' : textAlignClass === 'text-right' ? 'justify-end' : 'justify-start')}>
            <div 
              className={cn('rounded-full flex items-center justify-center', iconSizeClass)}
              style={{ 
                backgroundColor: `hsl(${ds.primaryColor} / 0.1)`,
                padding: '0.75rem'
              }}
            >
              <Sparkles className={iconSizeClass} style={{ color: `hsl(${ds.primaryColor})` }} />
            </div>
          </div>
        );

      case 'badge':
        const badgeVariantStyles = {
          default: {
            backgroundColor: `hsl(${ds.primaryColor} / 0.1)`,
            color: `hsl(${ds.primaryColor})`,
          },
          success: {
            backgroundColor: `hsl(${ds.successColor} / 0.1)`,
            color: `hsl(${ds.successColor})`,
          },
          warning: {
            backgroundColor: 'hsl(45 93% 47% / 0.1)',
            color: 'hsl(45 93% 47%)',
          },
          destructive: {
            backgroundColor: 'hsl(0 84% 60% / 0.1)',
            color: 'hsl(0 84% 60%)',
          },
        }[subBlock.badgeVariant || 'default'];

        return (
          <div className={cn('flex', textAlignClass === 'text-center' ? 'justify-center' : textAlignClass === 'text-right' ? 'justify-end' : 'justify-start')}>
            <span
              className="px-3 py-1 rounded-full text-xs font-medium inline-block"
              style={badgeVariantStyles}
              contentEditable={isEditing}
              suppressContentEditableWarning
              onBlur={(e) => {
                if (isEditing) {
                  onUpdate({ badgeText: e.currentTarget.textContent || '' });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {subBlock.badgeText || 'Бейдж'}
            </span>
          </div>
        );

      case 'animation':
        return (
          <div className={cn('flex', textAlignClass === 'text-center' ? 'justify-center' : textAlignClass === 'text-right' ? 'justify-end' : 'justify-start')}>
            <AnimationBlock
              src={subBlock.animationUrl}
              animationType={subBlock.animationType}
              size={subBlock.animationSize || 'medium'}
              stateMachine={subBlock.animationStateMachine}
              autoplay={subBlock.animationAutoplay !== false}
              loop={subBlock.animationLoop !== false}
              isEditing={isEditing}
              onUpdate={(updates) => onUpdate(updates)}
              designSystem={{
                primaryColor: ds.primaryColor,
                foregroundColor: ds.foregroundColor,
                mutedColor: ds.mutedColor,
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Badge and divider don't need extra padding
  const skipPadding = subBlock.type === 'badge' || subBlock.type === 'divider';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group w-full cursor-pointer',
        !skipPadding && paddingClass,
        isDragging && 'opacity-50 z-50',
        isEditing && 'hover:bg-primary/5 rounded-lg transition-colors',
        isSelected && 'ring-2 ring-primary ring-offset-2 rounded-lg'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      {renderSubBlockContent()}
      
      {/* Bottom controls - absolutely positioned, appear on hover */}
      {isEditing && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {/* Drag handle - bottom left */}
          <div
            className="p-1 cursor-grab hover:bg-muted/80 rounded-md transition-colors pointer-events-auto bg-background/80 backdrop-blur-sm"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          
          {/* Delete button - bottom right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-destructive/10 rounded-md transition-colors pointer-events-auto bg-background/80 backdrop-blur-sm"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      )}
    </div>
  );
};

// Template selector component
const TemplateSelector: React.FC<{
  onSelectTemplate: (templateId: DesignTemplateId) => void;
}> = ({ onSelectTemplate }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground text-center">Выберите шаблон</p>
      <div className="grid grid-cols-2 gap-2">
        {DESIGN_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className="p-3 rounded-xl border-2 border-border hover:border-primary transition-colors text-left"
          >
            <p className="font-medium text-sm">{template.nameRu}</p>
            <p className="text-xs text-muted-foreground">{template.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// Sub-block type selector
const SubBlockSelector: React.FC<{
  onSelectType: (type: SubBlockType) => void;
  onClose: () => void;
  inline?: boolean;
}> = ({ onSelectType, onClose, inline = false }) => {
  const types = Object.values(SUB_BLOCK_CONFIGS);
  
  if (inline) {
    return (
      <div className="flex flex-col gap-1 py-2 border-t border-border mt-4">
        <p className="text-xs text-muted-foreground mb-2 px-1">Добавить элемент:</p>
        {types.map((config) => {
          const IconComponent = iconMap[config.icon as keyof typeof iconMap];
          return (
            <button
              key={config.type}
              onClick={() => {
                onSelectType(config.type);
                onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left w-full"
            >
              {IconComponent && <IconComponent className="w-4 h-4 text-primary flex-shrink-0" />}
              <span className="text-sm">{config.labelRu}</span>
            </button>
          );
        })}
      </div>
    );
  }
  
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-border rounded-xl shadow-lg p-3 z-50 min-w-[260px]">
      <div className="grid grid-cols-2 gap-1.5">
        {types.map((config) => {
          const IconComponent = iconMap[config.icon as keyof typeof iconMap];
          return (
            <button
              key={config.type}
              onClick={() => {
                onSelectType(config.type);
                onClose();
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
            >
              {IconComponent && <IconComponent className="w-5 h-5 text-primary flex-shrink-0" />}
              <span className="text-sm font-medium">{config.labelRu}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const DesignBlockEditor: React.FC<DesignBlockEditorProps> = ({
  subBlocks,
  onUpdateSubBlocks,
  designSystem,
  isEditing = true,
  selectedSubBlockId,
  onSelectSubBlock,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(subBlocks.length === 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subBlocks.findIndex((sb) => sb.id === active.id);
    const newIndex = subBlocks.findIndex((sb) => sb.id === over.id);
    
    const reordered = arrayMove(subBlocks, oldIndex, newIndex).map((sb, i) => ({
      ...sb,
      order: i + 1,
    }));
    
    onUpdateSubBlocks(reordered);
  };

  const handleAddSubBlock = (type: SubBlockType) => {
    const newSubBlock = createSubBlock(type, subBlocks.length + 1);
    onUpdateSubBlocks([...subBlocks, newSubBlock]);
    setShowTemplateSelector(false);
  };

  const handleSelectTemplate = (templateId: DesignTemplateId) => {
    const newSubBlocks = createSubBlocksFromTemplate(templateId);
    onUpdateSubBlocks(newSubBlocks);
    setShowTemplateSelector(false);
  };

  const handleUpdateSubBlock = (id: string, updates: Partial<SubBlock>) => {
    onUpdateSubBlocks(
      subBlocks.map((sb) => (sb.id === id ? { ...sb, ...updates } : sb))
    );
  };

  const handleDeleteSubBlock = (id: string) => {
    onUpdateSubBlocks(
      subBlocks.filter((sb) => sb.id !== id).map((sb, i) => ({ ...sb, order: i + 1 }))
    );
  };

  const ds = {
    backgroundColor: designSystem?.backgroundColor || '0 0% 100%',
    foregroundColor: designSystem?.foregroundColor || '240 10% 4%',
  };

  // In read-only mode with no content, show empty state (not template selector)
  if (subBlocks.length === 0 && !isEditing) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: `hsl(${ds.backgroundColor})` }}
      >
        <p className="text-muted-foreground text-sm">Нет контента</p>
      </div>
    );
  }

  // In editing mode with no content, show template selector
  if (showTemplateSelector && subBlocks.length === 0 && isEditing) {
    return (
      <div 
        className="h-full flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: `hsl(${ds.backgroundColor})` }}
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 mb-4 flex items-center justify-center">
          <Layers className="w-7 h-7 text-primary" />
        </div>
        <TemplateSelector onSelectTemplate={handleSelectTemplate} />
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col p-4 overflow-auto w-full"
      style={{ backgroundColor: `hsl(${ds.backgroundColor})` }}
      onClick={() => {
        // Deselect when clicking empty space
        if (isEditing) {
          onSelectSubBlock?.(null);
        }
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={subBlocks.map((sb) => sb.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 flex flex-col w-full space-y-1">
            {subBlocks.map((subBlock) => (
              <SortableSubBlockItem
                key={subBlock.id}
                subBlock={subBlock}
                isEditing={isEditing}
                isSelected={selectedSubBlockId === subBlock.id}
                onSelect={() => onSelectSubBlock?.(subBlock.id)}
                onUpdate={(updates) => handleUpdateSubBlock(subBlock.id, updates)}
                onDelete={() => handleDeleteSubBlock(subBlock.id)}
                designSystem={designSystem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
