import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import { common, createLowlight } from 'lowlight';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  CodeSquare,
  Type,
  ImageIcon,
} from 'lucide-react';

const lowlight = createLowlight(common);

interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}

const slashMenuItems: SlashMenuItem[] = [
  {
    title: 'Текст',
    description: 'Обычный текст',
    icon: <Type className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: 'Заголовок 1',
    description: 'Большой заголовок',
    icon: <Heading1 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Заголовок 2',
    description: 'Средний заголовок',
    icon: <Heading2 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Заголовок 3',
    description: 'Маленький заголовок',
    icon: <Heading3 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Список',
    description: 'Маркированный список',
    icon: <List className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Нумерованный',
    description: 'Нумерованный список',
    icon: <ListOrdered className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Чек-лист',
    description: 'Список задач',
    icon: <CheckSquare className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Цитата',
    description: 'Блок цитаты',
    icon: <Quote className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Код',
    description: 'Блок кода',
    icon: <CodeSquare className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Разделитель',
    description: 'Горизонтальная линия',
    icon: <Minus className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

// Slash command menu component
const SlashMenu: React.FC<{
  editor: Editor;
  position: { top: number; left: number } | null;
  onClose: () => void;
}> = ({ editor, position, onClose }) => {
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = slashMenuItems.filter(
    (item) =>
      item.title.toLowerCase().includes(filter.toLowerCase()) ||
      item.description.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    if (!position) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          // Delete the slash and filter text
          const { state } = editor;
          const { from } = state.selection;
          const textBefore = state.doc.textBetween(
            Math.max(0, from - 20),
            from,
            '\n'
          );
          const slashIndex = textBefore.lastIndexOf('/');
          if (slashIndex !== -1) {
            const deleteFrom = from - (textBefore.length - slashIndex);
            editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
          }
          filtered[selectedIndex].command(editor);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [position, filtered, selectedIndex, editor, onClose]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border border-border rounded-xl shadow-lg p-1.5 w-64 max-h-80 overflow-auto"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground">Ничего не найдено</div>
      ) : (
        filtered.map((item, index) => (
          <button
            key={item.title}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
            )}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => {
              const { state } = editor;
              const { from } = state.selection;
              const textBefore = state.doc.textBetween(
                Math.max(0, from - 20),
                from,
                '\n'
              );
              const slashIndex = textBefore.lastIndexOf('/');
              if (slashIndex !== -1) {
                const deleteFrom = from - (textBefore.length - slashIndex);
                editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
              }
              item.command(editor);
              onClose();
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

// Bubble toolbar
const BubbleToolbar: React.FC<{ editor: Editor }> = ({ editor }) => {
  return (
    <div className="flex items-center gap-0.5 bg-popover border border-border rounded-xl shadow-lg p-1">
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolbarButton>
      <div className="w-px h-5 bg-border mx-0.5" />
      <ToolbarButton
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('highlight')}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="w-3.5 h-3.5" />
      </ToolbarButton>
      <div className="w-px h-5 bg-border mx-0.5" />
      <ToolbarButton
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="w-3.5 h-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="w-3.5 h-3.5" />
      </ToolbarButton>
    </div>
  );
};

const ToolbarButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      'p-1.5 rounded-lg transition-colors',
      active
        ? 'bg-accent text-accent-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
    )}
  >
    {children}
  </button>
);

// Main editor component
interface NotionEditorProps {
  content: string;
  placeholder?: string;
  onUpdate?: (html: string) => void;
  editable?: boolean;
  editorRef?: React.MutableRefObject<Editor | null>;
}

const NotionEditor: React.FC<NotionEditorProps> = ({
  content,
  placeholder = 'Напишите что-нибудь или введите / для команд...',
  onUpdate,
  editable = true,
  editorRef,
}) => {
  const [slashPos, setSlashPos] = useState<{ top: number; left: number } | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Highlight,
      Underline,
      Placeholder.configure({ placeholder }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image,
    ],
    content: content || '<p></p>',
    editable,
    editorProps: {
      attributes: {
        class: 'notion-editor prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] text-foreground',
      },
      handleKeyDown: (view, event) => {
        if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
          // Will show slash menu after the character is inserted
          setTimeout(() => {
            const { state } = view;
            const { from } = state.selection;
            const coords = view.coordsAtPos(from);
            setSlashPos({
              top: coords.bottom + 4,
              left: coords.left,
            });
            setSlashFilter('');
          }, 10);
          return false;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdate?.(e.getHTML());

      // Update slash filter
      if (slashPos) {
        const { state } = e;
        const { from } = state.selection;
        const textBefore = state.doc.textBetween(Math.max(0, from - 20), from, '\n');
        const slashIndex = textBefore.lastIndexOf('/');
        if (slashIndex !== -1) {
          setSlashFilter(textBefore.slice(slashIndex + 1));
        } else {
          setSlashPos(null);
        }
      }
    },
  });

  // Expose editor to parent
  useEffect(() => {
    if (editorRef) editorRef.current = editor;
  }, [editor, editorRef]);

  const closeSlashMenu = useCallback(() => {
    setSlashPos(null);
    setSlashFilter('');
  }, []);

  // Close slash menu on click outside
  useEffect(() => {
    if (!slashPos) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.slash-menu') && !target.closest('.notion-editor')) {
        closeSlashMenu();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [slashPos, closeSlashMenu]);

  if (!editor) return null;

  return (
    <div ref={containerRef} className="relative">
      {editor && (
        <BubbleMenu editor={editor}>
          <BubbleToolbar editor={editor} />
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />

      {slashPos && editor && (
        <div className="slash-menu">
          <SlashMenu editor={editor} position={slashPos} onClose={closeSlashMenu} />
        </div>
      )}
    </div>
  );
};

export { NotionEditor };
export type { NotionEditorProps };
export default NotionEditor;
