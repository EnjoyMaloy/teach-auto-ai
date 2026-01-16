import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Mark, mergeAttributes } from '@tiptap/core';
import { cn } from '@/lib/utils';
import { Highlighter, Underline as UnderlineIcon, Waves, X, Bold, Italic } from 'lucide-react';

// Extend the Commands interface for TypeScript
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wavyUnderline: {
      toggleWavyUnderline: () => ReturnType;
    };
  }
}

// Custom wavy underline extension
const WavyUnderline = Mark.create({
  name: 'wavyUnderline',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-wavy]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-wavy': 'true' }), 0];
  },
  
  addCommands() {
    return {
      toggleWavyUnderline: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});

// Toolbar component
interface ToolbarProps {
  editor: Editor | null;
  highlightColor: string;
  underlineColor: string;
  wavyColor: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ editor, highlightColor, underlineColor, wavyColor }) => {
  if (!editor) return null;

  return (
    <div 
      className="flex items-center gap-1 p-1.5 border-b border-border/50 bg-muted/30 rounded-t-lg flex-wrap"
      onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking toolbar
    >
      {/* Bold */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'w-7 h-7 rounded-md border transition-all flex items-center justify-center',
          editor.isActive('bold')
            ? 'border-primary bg-primary/20'
            : 'border-border hover:border-primary/50 bg-background'
        )}
        title="Жирный (Ctrl+B)"
        type="button"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      {/* Italic */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'w-7 h-7 rounded-md border transition-all flex items-center justify-center',
          editor.isActive('italic')
            ? 'border-primary bg-primary/20'
            : 'border-border hover:border-primary/50 bg-background'
        )}
        title="Курсив (Ctrl+I)"
        type="button"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />
      
      {/* Marker/Highlight */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={cn(
          'w-7 h-7 rounded-md border transition-all flex items-center justify-center',
          editor.isActive('highlight')
            ? 'border-primary bg-primary/20'
            : 'border-border hover:border-primary/50 bg-background'
        )}
        title="Маркер"
        type="button"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>
      
      {/* Underline */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          'w-7 h-7 rounded-md border transition-all flex items-center justify-center',
          editor.isActive('underline')
            ? 'border-primary bg-primary/20'
            : 'border-border hover:border-primary/50 bg-background'
        )}
        title="Подчёркивание"
        type="button"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>
      
      {/* Wavy underline */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleWavyUnderline().run()}
        className={cn(
          'w-7 h-7 rounded-md border transition-all flex items-center justify-center',
          editor.isActive('wavyUnderline')
            ? 'border-primary bg-primary/20'
            : 'border-border hover:border-primary/50 bg-background'
        )}
        title="Волнистая линия"
        type="button"
      >
        <Waves className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Clear formatting */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        className="w-7 h-7 rounded-md border border-border hover:border-destructive/50 bg-background transition-all flex items-center justify-center"
        title="Убрать форматирование"
        type="button"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
};

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  textSize?: 'small' | 'medium' | 'large' | 'xlarge';
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  highlightColor?: string;
  underlineColor?: string;
  wavyColor?: string;
  isEditing?: boolean;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Введите текст...',
  textSize = 'medium',
  textAlign = 'left',
  textColor = 'inherit',
  highlightColor = '50 100% 50% / 0.4',
  underlineColor = '262 83% 58%',
  wavyColor = '0 84% 60%',
  isEditing = true,
  className,
  onFocusChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  }[textSize];

  const textAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[textAlign];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Keep bold and italic, disable others
        strike: false,
        code: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: {
          class: 'rich-text-highlight',
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'rich-text-underline',
        },
      }),
      WavyUnderline.configure({
        HTMLAttributes: {
          class: 'rich-text-wavy',
        },
      }),
    ],
    content: content || '',
    editable: isEditing,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'outline-none min-h-[60px] px-1 py-2',
          textSizeClass,
          textAlignClass
        ),
        style: `color: ${textColor}`,
      },
    },
  });

  // Update content when prop changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // Dynamic styles for highlighting
  const dynamicStyles = `
    .rich-text-highlight {
      background-color: hsl(${highlightColor});
      padding: 0 2px;
      border-radius: 2px;
    }
    .rich-text-underline {
      text-decoration-line: underline;
      text-decoration-style: solid;
      text-decoration-color: hsl(${underlineColor});
      text-decoration-thickness: 2px;
      text-underline-offset: 3px;
    }
    .rich-text-wavy {
      text-decoration-line: underline;
      text-decoration-style: wavy;
      text-decoration-color: hsl(${wavyColor});
      text-underline-offset: 4px;
    }
    [data-wavy="true"] {
      text-decoration-line: underline;
      text-decoration-style: wavy;
      text-decoration-color: hsl(${wavyColor});
      text-underline-offset: 4px;
    }
  `;

  if (!isEditing) {
    return (
      <div 
        className={cn(textSizeClass, textAlignClass, className)}
        style={{ color: textColor }}
      >
        <style>{dynamicStyles}</style>
        <div dangerouslySetInnerHTML={{ __html: content || placeholder }} />
      </div>
    );
  }

  return (
    <div 
      className={cn('rounded-lg transition-all', isFocused ? 'border border-border/50' : '', className)} 
      onClick={(e) => e.stopPropagation()}
      onFocus={() => {
        setIsFocused(true);
        onFocusChange?.(true);
      }}
      onBlur={(e) => {
        // Only blur if focus moves outside this component
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsFocused(false);
          onFocusChange?.(false);
        }
      }}
    >
      <style>{dynamicStyles}</style>
      {isFocused && (
        <Toolbar 
          editor={editor} 
          highlightColor={highlightColor}
          underlineColor={underlineColor}
          wavyColor={wavyColor}
        />
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
