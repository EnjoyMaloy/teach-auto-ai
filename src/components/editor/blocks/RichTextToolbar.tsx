import React from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { Bold, Italic, Highlighter, Underline, Waves } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RichTextToolbarProps {
  editor: Editor | null;
  highlightColor?: string;
  underlineColor?: string;
  wavyColor?: string;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  editor,
  highlightColor = '50 100% 50% / 0.4',
  underlineColor = '262 83% 58%',
  wavyColor = '0 84% 60%',
}) => {
  if (!editor) return null;

  const toolbarButtons = [
    {
      icon: Bold,
      label: 'Жирный',
      shortcut: 'Ctrl+B',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: Italic,
      label: 'Курсив',
      shortcut: 'Ctrl+I',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: Highlighter,
      label: 'Маркер',
      shortcut: '',
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive('highlight'),
      previewStyle: { backgroundColor: `hsl(${highlightColor})` },
    },
    {
      icon: Underline,
      label: 'Подчёркивание',
      shortcut: 'Ctrl+U',
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
      previewStyle: { borderBottom: `2px solid hsl(${underlineColor})` },
    },
    {
      icon: Waves,
      label: 'Волна',
      shortcut: '',
      action: () => editor.chain().focus().toggleWavyUnderline().run(),
      isActive: editor.isActive('wavyUnderline'),
      previewStyle: { 
        textDecoration: 'underline wavy',
        textDecorationColor: `hsl(${wavyColor})`,
      },
    },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 p-1 bg-muted/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
        {toolbarButtons.map(({ icon: Icon, label, shortcut, action, isActive, previewStyle }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onMouseDown={(e) => {
                  // Prevent blur and keep text selection
                  e.preventDefault();
                  e.stopPropagation();
                  action();
                }}
                className={cn(
                  "p-1.5 rounded-md transition-colors relative",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-background/80 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {previewStyle && !isActive && (
                  <span 
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-0.5 rounded-full"
                    style={previewStyle}
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <span>{label}</span>
              {shortcut && <span className="ml-1 text-muted-foreground">({shortcut})</span>}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default RichTextToolbar;
