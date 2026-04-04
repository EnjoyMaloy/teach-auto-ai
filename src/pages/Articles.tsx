import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ArrowLeft, FileText, Save, Loader2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const ArticleEditor: React.FC<{
  article: Article;
  onBack: () => void;
  onSaved: (updated: Article) => void;
  onDelete: (id: string) => void;
}> = ({ article, onBack, onSaved, onDelete }) => {
  const [title, setTitle] = useState(article.title);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
    ],
    content: article.content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    const html = editor.getHTML();
    const { data, error } = await supabase
      .from('articles')
      .update({ title, content: html })
      .eq('id', article.id)
      .select()
      .single();

    setSaving(false);
    if (error) {
      toast.error('Ошибка сохранения');
    } else {
      toast.success('Сохранено');
      onSaved(data as Article);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 h-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-10 w-10 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название инструкции..."
          className="text-lg font-semibold flex-1 rounded-xl h-10"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="rounded-xl h-10 w-10 shrink-0 bg-muted hover:bg-muted/80 text-muted-foreground border-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDelete(article.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2 h-10 shrink-0">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Сохранить
        </Button>
      </div>
      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

const Articles: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const fetchArticles = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setArticles(data as Article[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('articles')
      .insert({ user_id: user.id, title: 'Новая инструкция', content: '' })
      .select()
      .single();

    if (error) {
      toast.error('Ошибка создания');
    } else {
      const newArticle = data as Article;
      setArticles((prev) => [newArticle, ...prev]);
      setEditingArticle(newArticle);
    }
  };

  const deleteArticle = async (id: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления');
    } else {
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setEditingArticle(null);
      toast.success('Инструкция удалена');
    }
  };

  if (editingArticle) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ArticleEditor
          article={editingArticle}
          onBack={() => {
            setEditingArticle(null);
            fetchArticles();
          }}
          onSaved={(updated) => {
            setEditingArticle(updated);
            setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          }}
          onDelete={deleteArticle}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Инструкции</h1>
          <p className="text-sm text-muted-foreground">Создавайте инструкции, публикуйте их в Open Academy и встраивайте в курсы</p>
        </div>
        <Button onClick={createArticle} size="sm" className="h-8 px-3 bg-primary hover:bg-primary/90 text-[13px] rounded-xl gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Создать инструкцию
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Нет инструкций</p>
          <Button variant="outline" onClick={createArticle} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" />
            Создать первую инструкцию
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => setEditingArticle(article)}
              className={cn(
                'w-full text-left p-4 rounded-2xl border border-border',
                'bg-card hover:bg-muted/50 transition-colors',
                'flex items-center gap-3'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {article.title || 'Без названия'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(article.updated_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Articles;
