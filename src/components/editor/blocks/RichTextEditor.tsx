import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Mark, mergeAttributes } from '@tiptap/core';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { useTextEditor } from './TextEditorContext';

// Configure DOMPurify to allow only safe formatting tags
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'mark', 'u', 'p', 'br'],
  ALLOWED_ATTR: ['class', 'data-wavy', 'style'],
  KEEP_CONTENT: true,
};

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
};

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

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  textSize?: 'small' | 'medium' | 'large' | 'xlarge';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textColor?: string;
  highlightColor?: string;
  underlineColor?: string;
  wavyColor?: string;
  isEditing?: boolean;
  showToolbar?: boolean;
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
  showToolbar = true,
  className,
  onFocusChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { setActiveEditor } = useTextEditor();
  const textSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  }[textSize];

  const isJustified = textAlign === 'justify';
  
  // For justify, we use custom CSS instead of Tailwind class
  const textAlignClass = isJustified ? '' : {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[textAlign] || 'text-left';

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
          'outline-none px-0 py-0 leading-tight',
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

  // Dynamic styles for highlighting and justify
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
    ${isJustified ? `
    .rich-text-editor-wrapper,
    .rich-text-editor-wrapper .ProseMirror,
    .rich-text-editor-wrapper .ProseMirror p,
    .rich-text-editor-wrapper > div,
    .rich-text-readonly-wrapper,
    .rich-text-readonly-wrapper > div,
    .rich-text-readonly-wrapper > div > * {
      text-align: justify !important;
      text-justify: inter-word !important;
      word-spacing: 0.05em;
    }
    ` : ''}
  `;

  if (!isEditing) {
    return (
      <div 
        className={cn(textSizeClass, textAlignClass, 'rich-text-readonly-wrapper w-full', className)}
        style={{ 
          color: textColor,
          ...(isJustified ? { textAlign: 'justify', textJustify: 'inter-word' } : {})
        }}
      >
        <style>{dynamicStyles}</style>
        <div 
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || placeholder) }}
          style={isJustified ? { textAlign: 'justify', textJustify: 'inter-word' } : {}}
        />
      </div>
    );
  }

  return (
    <div 
      className={cn('rounded-lg transition-all rich-text-editor-wrapper w-full', textAlignClass, isFocused ? 'border border-border/50' : '', className)}
      onClick={(e) => e.stopPropagation()}
      style={isJustified ? { textAlign: 'justify', textJustify: 'inter-word' } : {}}
      onFocus={() => {
        setIsFocused(true);
        setActiveEditor(editor);
        onFocusChange?.(true);
      }}
      onBlur={(e) => {
        // Only blur if focus moves outside this component
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsFocused(false);
          // Don't clear editor immediately - let sidebar use it
          onFocusChange?.(false);
        }
      }}
    >
      <style>{dynamicStyles}</style>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
