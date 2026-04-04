import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ArrowLeft, FileText, Save, Loader2, MoreVertical, Languages, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ARTICLE_GRADIENTS } from '@/components/articles/ArticleCoverEditor';
import ArticleSettingsDialog from '@/components/articles/ArticleSettingsDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Article {
  id: string;
  title: string;
  title_en: string | null;
  content: string;
  content_en: string | null;
  cover_gradient: string | null;
  cover_image: string | null;
  translation_stale: boolean;
  created_at: string;
  updated_at: string;
}

const ArticleEditor: React.FC<{
  article: Article;
  onBack: () => void;
  onSaved: (updated: Article) => void;
  onDelete: (id: string) => void;
}> = ({ article, onBack, onSaved, onDelete }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(article.title);
  const [titleEn, setTitleEn] = useState(article.title_en || '');
  const [contentEn, setContentEn] = useState(article.content_en || '');
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const [coverGradient, setCoverGradient] = useState(article.cover_gradient);
  const [coverImage, setCoverImage] = useState(article.cover_image);
  const [translationStale, setTranslationStale] = useState(article.translation_stale);
  const [authorName, setAuthorName] = useState<string>('');

  const hasEnContent = !!contentEn && contentEn !== '<p></p>' && contentEn !== '';

  useEffect(() => {
    if (user) {
      const meta = user.user_metadata;
      setAuthorName(meta?.name || meta?.full_name || user.email?.split('@')[0] || '');
    }
  }, [user]);

  const editorRu = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
      Placeholder.configure({ placeholder: 'Начните писать...' }),
    ],
    content: article.content || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] text-foreground',
      },
    },
    onUpdate: () => {
      if (hasEnContent) {
        setTranslationStale(true);
      }
    },
  });

  const editorEn = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: article.content_en || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] text-foreground',
      },
    },
    editable: true,
  });

  const handleTranslate = async () => {
    if (!editorRu) return;
    const htmlRu = editorRu.getHTML();
    setTranslating(true);

    try {
      // Save RU content to DB first so edge function can read it
      await supabase
        .from('articles')
        .update({ title, content: htmlRu })
        .eq('id', article.id);

      const { data, error } = await supabase.functions.invoke('translate-article', {
        body: { articleId: article.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setTitleEn(data.title_en);
      setContentEn(data.content_en);
      setTranslationStale(false);
      editorEn?.commands.setContent(data.content_en);
      toast.success('Перевод готов');
      setLang('en');
      
      // Update parent
      onSaved({
        ...article,
        title,
        title_en: data.title_en,
        content: htmlRu,
        content_en: data.content_en,
        cover_gradient: coverGradient,
        cover_image: coverImage,
        translation_stale: false,
      });
    } catch (e: any) {
      toast.error(e.message || 'Ошибка перевода');
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!editorRu || !editorEn) return;
    setSaving(true);
    const htmlRu = editorRu.getHTML();
    const htmlEn = editorEn.getHTML();
    
    // Mark translation as stale if RU content changed and EN translation exists
    const hasEn = !!contentEn && contentEn !== '<p></p>' && contentEn !== '';
    const ruChanged = htmlRu !== article.content || title !== article.title;
    const newStale = hasEn && ruChanged ? true : translationStale;
    
    const { data, error } = await supabase
      .from('articles')
      .update({
        title,
        title_en: titleEn || null,
        content: htmlRu,
        content_en: htmlEn || null,
        cover_gradient: coverGradient,
        cover_image: coverImage,
        translation_stale: newStale,
      })
      .eq('id', article.id)
      .select()
      .single();

    setSaving(false);
    if (error) {
      toast.error('Ошибка сохранения');
    } else {
      setTranslationStale(newStale);
      toast.success('Сохранено');
      onSaved(data as Article);
    }
  };


  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayTitle = lang === 'ru' ? title : (titleEn || title);

  return (
    <div className="min-h-screen">
      {/* Top toolbar */}
      <div className="sticky top-2 z-10 max-w-3xl mx-auto px-4">
        <div className="bg-sidebar border border-sidebar-border rounded-lg shadow-sm">
          <div className="flex items-center gap-2 h-11 px-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-8 w-8 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1" />

          {/* Language toggle */}
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setLang('ru')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                lang === 'ru' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              RU
            </button>
            <button
              onClick={() => setLang('en')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                lang === 'en' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              EN
            </button>
          </div>

          {hasEnContent && translationStale && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                {lang === 'ru' ? 'RU изменён — обновите перевод' : 'Перевод может быть устаревшим'}
              </TooltipContent>
            </Tooltip>
          )}

          {lang === 'ru' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleTranslate}
                  disabled={translating}
                  className={cn("rounded-lg h-8 w-8", translationStale && hasEnContent && "text-amber-500")}
                >
                  {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {hasEnContent ? 'Перевести заново' : 'Перевести на EN'}
              </TooltipContent>
            </Tooltip>
          )}

          <ArticleSettingsDialog
            title={title}
            titleEn={titleEn}
            coverGradient={coverGradient}
            coverImage={coverImage}
            articleId={article.id}
            onTitleChange={setTitle}
            onTitleEnChange={setTitleEn}
            onCoverUpdate={(g, img) => {
              setCoverGradient(g);
              setCoverImage(img);
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 shrink-0 text-muted-foreground">
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

          <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-lg gap-1.5 h-8 px-3">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="text-xs">Сохранить</span>
          </Button>
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Title */}
        <input
          value={displayTitle}
          onChange={(e) => lang === 'ru' ? setTitle(e.target.value) : setTitleEn(e.target.value)}
          placeholder={lang === 'ru' ? 'Заголовок' : 'Title'}
          className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 text-foreground mb-6"
        />

        {/* Content editor */}
        <div className={lang === 'ru' ? '' : 'hidden'}>
          <EditorContent editor={editorRu} />
        </div>
        <div className={lang === 'en' ? '' : 'hidden'}>
          <EditorContent editor={editorEn} />
        </div>
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
      <div>
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: article.cover_gradient || ARTICLE_GRADIENTS[0] }}
              >
                {article.cover_image ? (
                  <img src={article.cover_image} alt="" className="w-7 h-7 object-contain" />
                ) : (
                  <FileText className="w-5 h-5 text-white/60" />
                )}
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
