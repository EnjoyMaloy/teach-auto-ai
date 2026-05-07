import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft, FileText, Save, Loader2, Settings, Languages, AlertTriangle, X, Tag, Eye, Clock, Globe, Link2, Lock, Copy, Check, Search, Star, MoreHorizontal, Image as ImageIcon, ShieldCheck, Layers } from 'lucide-react';

import { toast } from 'sonner';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import ArticleCoverEditor, { ARTICLE_GRADIENTS } from '@/components/articles/ArticleCoverEditor';
import ArticleType2Cover from '@/components/articles/ArticleType2Cover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import NotionEditor from '@/components/articles/NotionEditor';
import { useFavoriteArticles } from '@/hooks/useFavoriteArticles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface Article {
  id: string;
  title: string;
  title_en: string | null;
  content: string;
  content_en: string | null;
  cover_gradient: string | null;
  cover_image: string | null;
  title_color: string | null;
  cover_type: string | null;
  category: string | null;
  translation_stale: boolean;
  access_type: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  seo_title_en: string | null;
  seo_description_en: string | null;
  seo_keywords_en: string[] | null;
  og_image: string | null;
  created_at: string;
  updated_at: string;
}

const estimateReadingMinutes = (html: string): number => {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  return Math.max(1, Math.round(words / 200));
};

const LinkCopyRow: React.FC<{ slug: string }> = ({ slug }) => {
  const [copied, setCopied] = useState(false);
  const url = `https://learn.open-academy.app/guides/${slug}`;
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Ссылка скопирована');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 truncate rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground select-all">
        {url}
      </div>
      <Button variant="outline" size="icon" className="rounded-lg h-9 w-9 shrink-0" onClick={handleCopy}>
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
};

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
  const [titleColor, setTitleColor] = useState(article.title_color || '#ffffff');
  const [coverType, setCoverType] = useState<'type1' | 'type2'>((article.cover_type as 'type1' | 'type2') || 'type1');
  const [category, setCategory] = useState(article.category || '');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [translationStale, setTranslationStale] = useState(article.translation_stale);
  const [accessType, setAccessType] = useState(article.access_type || 'private');
  const [seoTitle, setSeoTitle] = useState(article.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(article.seo_description || '');
  const [seoKeywords, setSeoKeywords] = useState<string[]>(article.seo_keywords || []);
  const [seoTitleEn, setSeoTitleEn] = useState(article.seo_title_en || '');
  const [seoDescriptionEn, setSeoDescriptionEn] = useState(article.seo_description_en || '');
  const [seoKeywordsEn, setSeoKeywordsEn] = useState<string[]>(article.seo_keywords_en || []);
  const [ogImage, setOgImage] = useState(article.og_image || '');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywordInputEn, setKeywordInputEn] = useState('');
  const [uploadingOg, setUploadingOg] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'instruction' | 'cover' | 'access' | 'details' | 'seo'>('instruction');
  const hasEnContent = !!contentEn && contentEn !== '<p></p>' && contentEn !== '';

  const editorRuRef = useRef<Editor | null>(null);
  const editorEnRef = useRef<Editor | null>(null);

  const handleTranslate = async () => {
    if (!editorRuRef.current) return;
    const htmlRu = editorRuRef.current.getHTML();
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
      editorEnRef.current?.commands.setContent(data.content_en);
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
    if (!editorRuRef.current || !editorEnRef.current) return;
    setSaving(true);
    const htmlRu = editorRuRef.current.getHTML();
    const htmlEn = editorEnRef.current.getHTML();
    
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
        title_color: titleColor,
        cover_type: coverType,
        category: category || null,
        translation_stale: newStale,
        access_type: accessType,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        seo_keywords: seoKeywords,
        seo_title_en: seoTitleEn || null,
        seo_description_en: seoDescriptionEn || null,
        seo_keywords_en: seoKeywordsEn,
        og_image: ogImage || null,
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


  const showSettings = settingsTab !== 'instruction';
  const displayTitle = lang === 'ru' ? title : (titleEn || title);

  return (
    <div className="min-h-screen">
      {/* Top toolbar */}
      <div className="sticky top-2 z-30 max-w-6xl mx-auto px-4">
        <div className="bg-sidebar border border-sidebar-border rounded-lg shadow-sm">
          <div className="flex items-center gap-2 h-11 px-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl h-8 w-8 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="flex-1" />

            {/* Language toggle (always visible) */}
            <div className="flex bg-muted rounded-lg p-1">
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

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="article-action-hover inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-background px-3 text-xs font-semibold text-foreground ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span className="text-xs">Сохранить</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unified layout: sidebar + content */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-8 items-start">
          {/* Sidebar tabs */}
          <nav className="w-48 shrink-0 sticky top-20 space-y-1">
            {([
              { id: 'instruction', label: 'Инструкция', icon: FileText },
              { id: 'cover', label: 'Обложка', icon: ImageIcon },
              { id: 'access', label: 'Доступ', icon: ShieldCheck },
              { id: 'seo', label: 'SEO', icon: Tag },
              { id: 'details', label: 'Детали', icon: Layers },
            ] as const).map((t) => {
              const Icon = t.icon;
              const active = settingsTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSettingsTab(t.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Tab content */}
          <div className="flex-1 min-w-0 space-y-6">
            {settingsTab === 'instruction' && (
              <div>
                <textarea
                  value={displayTitle}
                  onChange={(e) => lang === 'ru' ? setTitle(e.target.value) : setTitleEn(e.target.value)}
                  placeholder={lang === 'ru' ? 'Заголовок' : 'Title'}
                  rows={1}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }}
                  ref={(el) => {
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                    }
                  }}
                  className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 text-foreground mb-6 resize-none overflow-hidden leading-tight break-words"
                />
                <div className={lang === 'ru' ? '' : 'hidden'}>
                  <NotionEditor
                    content={article.content || ''}
                    placeholder="Напишите что-нибудь или введите / для команд..."
                    editorRef={editorRuRef}
                    onUpdate={() => { if (hasEnContent) setTranslationStale(true); }}
                  />
                </div>
                <div className={lang === 'en' ? '' : 'hidden'}>
                  <NotionEditor
                    content={article.content_en || ''}
                    placeholder="Start writing or type / for commands..."
                    editorRef={editorEnRef}
                  />
                </div>
              </div>
            )}

            {settingsTab === 'cover' && (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Тип обложки</p>
                  <div className="inline-flex bg-muted rounded-lg p-1">
                    {([
                      { id: 'type1', name: 'Тип 1' },
                      { id: 'type2', name: 'Тип 2' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setCoverType(opt.id)}
                        className={cn(
                          'px-4 py-1.5 text-xs font-medium rounded-md transition-colors',
                          coverType === opt.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-sm font-medium text-foreground">Шапка</p>
                {(() => {
                  const gradient =
                    coverGradient ||
                    ARTICLE_GRADIENTS[Math.abs(article.id.charCodeAt(0)) % ARTICLE_GRADIENTS.length];
                  if (coverType === 'type2') {
                    return (
                      <ArticleType2Cover
                        variant="banner"
                        gradient={gradient}
                        image={coverImage}
                        title={displayTitle || 'Новая инструкция'}
                        titleColor={titleColor}
                      />
                    );
                  }
                  return (
                    <div
                      className="w-full rounded-2xl overflow-hidden border border-border shadow-md flex items-center gap-4 px-8"
                      style={{ background: gradient, aspectRatio: '4 / 1' }}
                    >
                      <h3
                        className="flex-1 leading-tight line-clamp-3 font-light text-4xl"
                        style={{ fontFamily: '"Wix Madefor Display", system-ui, sans-serif', color: titleColor }}
                      >
                        {displayTitle || 'Новая инструкция'}
                      </h3>
                      <div className="h-[80%] aspect-square shrink-0 flex items-center justify-center">
                        {coverImage && (
                          <img src={coverImage} alt="" className="max-h-full max-w-full object-contain drop-shadow-lg" />
                        )}
                      </div>
                    </div>
                  );
                })()}

                <ArticleCoverEditor
                  gradient={coverGradient}
                  image={coverImage}
                  articleId={article.id}
                  title={title}
                  titleEn={titleEn}
                  titleColor={titleColor}
                  coverType={coverType}
                  onTitleColorChange={setTitleColor}
                  authorName={user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || ''}
                  authorAvatar={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''}
                  onUpdate={(g, img) => {
                    setCoverGradient(g);
                    setCoverImage(img);
                  }}
                />
              </>
            )}

            {settingsTab === 'access' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Доступ</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    { id: 'private', name: 'Закрытый', icon: Lock },
                    { id: 'link', name: 'По ссылке', icon: Link2 },
                    { id: 'public', name: 'В каталоге', icon: Globe },
                  ] as const).map((opt) => {
                    const isSelected = accessType === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setAccessType(opt.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {opt.name}
                      </button>
                    );
                  })}
                </div>
                {accessType === 'link' && (
                  <LinkCopyRow slug={titleEn ? titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : article.id} />
                )}
              </div>
            )}

            {settingsTab === 'details' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Категория</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'ai', name: 'ИИ' },
                      { id: 'crypto', name: 'Крипта' },
                    ].map((cat) => {
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(isSelected ? '' : cat.id)}
                          className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                          )}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                    {category && !['ai', 'crypto'].includes(category) && (
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground border border-primary">
                        {category}
                        <button onClick={() => setCategory('')} className="ml-0.5 hover:opacity-70">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {customCategoryInput !== null && typeof customCategoryInput === 'string' && customCategoryInput !== '' ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          placeholder="Название..."
                          className="rounded-full text-sm h-auto py-2 px-4 w-28"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customCategoryInput.trim()) {
                              setCategory(customCategoryInput.trim());
                              setCustomCategoryInput('');
                            }
                            if (e.key === 'Escape') setCustomCategoryInput('');
                          }}
                          onBlur={() => {
                            if (customCategoryInput.trim()) {
                              setCategory(customCategoryInput.trim());
                            }
                            setCustomCategoryInput('');
                          }}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setCustomCategoryInput(' ')}
                        className="w-8 h-8 rounded-full bg-muted text-muted-foreground hover:border-border border border-transparent flex items-center justify-center transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Сведения</Label>
                  <div className="rounded-xl border border-border bg-muted/50 divide-y divide-border">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Время чтения</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">~{estimateReadingMinutes(editorRuRef.current?.getHTML() || article.content || '')} мин</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 dark:border-border">
                  <Button
                    variant="ghost"
                    onClick={() => onDelete(article.id)}
                    className="text-red-400 hover:text-red-500 bg-red-50 hover:bg-red-100 dark:bg-transparent dark:text-destructive dark:hover:bg-destructive/10 gap-2 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить инструкцию
                  </Button>
                </div>
              </>
            )}

            {settingsTab === 'seo' && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SEO · RU</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SEO Title</Label>
                    <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Заголовок для поисковиков" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SEO Description</Label>
                    <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Краткое описание (до 160 символов)" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Keywords</Label>
                    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-2 min-h-10">
                      {seoKeywords.map((kw, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs">
                          {kw}
                          <button onClick={() => setSeoKeywords(seoKeywords.filter((_, j) => j !== i))} className="hover:opacity-70">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ',') && keywordInput.trim()) {
                            e.preventDefault();
                            setSeoKeywords([...seoKeywords, keywordInput.trim()]);
                            setKeywordInput('');
                          }
                          if (e.key === 'Backspace' && !keywordInput && seoKeywords.length) {
                            setSeoKeywords(seoKeywords.slice(0, -1));
                          }
                        }}
                        placeholder="Добавить ключевое слово..."
                        className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SEO · EN</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SEO Title</Label>
                    <Input value={seoTitleEn} onChange={(e) => setSeoTitleEn(e.target.value)} placeholder="Search engine title" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SEO Description</Label>
                    <Textarea value={seoDescriptionEn} onChange={(e) => setSeoDescriptionEn(e.target.value)} placeholder="Short description (max 160 chars)" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Keywords</Label>
                    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-2 min-h-10">
                      {seoKeywordsEn.map((kw, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs">
                          {kw}
                          <button onClick={() => setSeoKeywordsEn(seoKeywordsEn.filter((_, j) => j !== i))} className="hover:opacity-70">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        value={keywordInputEn}
                        onChange={(e) => setKeywordInputEn(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ',') && keywordInputEn.trim()) {
                            e.preventDefault();
                            setSeoKeywordsEn([...seoKeywordsEn, keywordInputEn.trim()]);
                            setKeywordInputEn('');
                          }
                          if (e.key === 'Backspace' && !keywordInputEn && seoKeywordsEn.length) {
                            setSeoKeywordsEn(seoKeywordsEn.slice(0, -1));
                          }
                        }}
                        placeholder="Add keyword..."
                        className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-sm font-medium">OG image</Label>
                  {ogImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={ogImage} alt="OG" className="w-full aspect-[1200/630] object-cover" />
                      <button
                        onClick={() => setOgImage('')}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-md bg-black/70 text-white text-xs hover:bg-black/90"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                  <label className={cn(
                    "block rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer",
                    ogImage ? "py-4" : "aspect-[1200/630] flex items-center justify-center"
                  )}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingOg(true);
                        const ext = file.name.split('.').pop() || 'png';
                        const path = `article-covers/${article.id}/og-${Date.now()}.${ext}`;
                        const { error } = await supabase.storage.from('course-images').upload(path, file, { upsert: true });
                        if (error) {
                          toast.error('Ошибка загрузки');
                        } else {
                          const { data } = supabase.storage.from('course-images').getPublicUrl(path);
                          setOgImage(data.publicUrl);
                        }
                        setUploadingOg(false);
                        e.target.value = '';
                      }}
                    />
                    <div className="flex flex-col items-center justify-center text-sm text-muted-foreground gap-1">
                      {uploadingOg ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5" />
                          <span>{ogImage ? 'Drop to replace' : 'Загрузите изображение 1200×630'}</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>
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
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null } | null>(null);
  const [accessFilter, setAccessFilter] = useState<'all' | 'private' | 'link' | 'public' | 'favorites'>('all');
  const [search, setSearch] = useState('');
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const { isFavorite, toggleFavorite } = useFavoriteArticles();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

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
      .insert({ user_id: user.id, title: 'Новая инструкция', title_en: 'New instruction', content: '' })
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
    <div className="relative z-10 px-4 md:px-10 lg:px-16 xl:px-24 py-4 md:py-6">
      <div className="h-16 md:h-2" />
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Инструкции</h1>
            <p className="text-sm text-muted-foreground">Создавайте инструкции, публикуйте их в Open Academy или встраивайте в свои курсы</p>
          </div>
          <Button onClick={createArticle} style={{ boxShadow: 'none' }} className="h-11 px-5 rounded-2xl bg-white hover:bg-white/90 text-neutral-900 text-sm shrink-0 border-0 hover:translate-y-0">
            <Plus className="w-4 h-4 mr-2" />
            Создать инструкцию
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {([
              { id: 'all', label: 'Все', icon: null },
              { id: 'favorites', label: 'Избранные', icon: Star },
              { id: 'private', label: 'Закрытый', icon: Lock },
              { id: 'link', label: 'По ссылке', icon: Link2 },
              { id: 'public', label: 'В каталоге', icon: Globe },
            ] as const).map((f) => {
              const Icon = f.icon;
              const count = f.id === 'all'
                ? articles.length
                : f.id === 'favorites'
                  ? articles.filter(a => isFavorite(a.id)).length
                  : articles.filter(a => (a.access_type || 'private') === f.id).length;
              const isActive = accessFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setAccessFilter(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap border ${
                    isActive
                      ? 'bg-sidebar border-sidebar-border text-foreground dark:text-white'
                      : 'border-transparent text-muted-foreground hover:text-foreground dark:text-white/40 dark:hover:text-white/60'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {f.label}
                  <span className="ml-1 text-muted-foreground dark:text-white/30">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию"
              className="h-8 pl-8 text-[13px] bg-background/40 border-border"
            />
          </div>
        </div>
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
        <div className="grid gap-3 md:gap-5 [grid-template-columns:repeat(auto-fill,minmax(240px,240px))] justify-start">
          {articles
            .filter(a => {
              if (accessFilter === 'favorites' && !isFavorite(a.id)) return false;
              if (accessFilter !== 'all' && accessFilter !== 'favorites' && (a.access_type || 'private') !== accessFilter) return false;
              if (search.trim() && !(a.title || '').toLowerCase().includes(search.toLowerCase())) return false;
              return true;
            })
            .map((article) => {
            const gradient = article.cover_gradient || ARTICLE_GRADIENTS[Math.abs(article.id.charCodeAt(0)) % ARTICLE_GRADIENTS.length];
            return (
              <div
                key={article.id}
                onClick={() => setEditingArticle(article)}
                className="group relative text-left rounded-2xl overflow-hidden border border-border shadow-md transition-transform duration-300 hover:scale-[1.02] aspect-[4/5] flex flex-col cursor-pointer"
                style={{ background: gradient }}
              >
                {/* Top right controls */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="w-8 h-8 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center text-white/90 hover:text-white transition-colors opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[140px] bg-card dark:bg-[#1a1a1b] border-border dark:border-white/10 p-1 z-50"
                    >
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingArticle(article);
                        }}
                        className="text-[13px] text-muted-foreground focus:text-foreground focus:bg-muted dark:text-white/70 dark:focus:text-white dark:focus:bg-white/5 rounded px-2 py-1.5"
                      >
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        Открыть
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 bg-border dark:bg-white/5" />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setArticleToDelete(article);
                        }}
                        className="text-[13px] text-red-400 focus:text-red-400 focus:bg-red-500/10 rounded px-2 py-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(article.id);
                    }}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                      isFavorite(article.id)
                        ? 'bg-black/40 backdrop-blur-sm text-white'
                        : 'bg-black/30 backdrop-blur-sm text-white/90 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-black/50'
                    )}
                  >
                    <Star className="w-4 h-4" fill={isFavorite(article.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Image area */}
                <div className="w-full flex-1 min-h-0 flex items-center justify-center relative px-4 pb-4 pt-12">
                  {article.cover_image && (
                    <img
                      src={article.cover_image}
                      alt=""
                      className="max-h-full max-w-full object-contain relative z-10 drop-shadow-lg"
                    />
                  )}
                </div>

                {/* Bottom info */}
                <div className="px-4 pb-4 pt-0 space-y-2">
                  <h3
                    className="font-semibold text-base leading-tight text-center line-clamp-2 [overflow-wrap:anywhere] hyphens-auto"
                    style={{ fontFamily: '"Wix Madefor Display", system-ui, sans-serif', color: article.title_color || '#ffffff' }}
                  >
                    {article.title || 'Новая инструкция'}
                  </h3>
                  <div className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 mx-auto w-fit">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/30" />
                    )}
                    <span className="text-white text-xs font-medium truncate max-w-[70px]">
                      {profile?.name || 'Автор'}
                    </span>
                    <Eye className="w-3 h-3 text-white/70" />
                    <span className="text-white/70 text-xs">0</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!articleToDelete} onOpenChange={() => setArticleToDelete(null)}>
        <AlertDialogContent className="bg-[#0f0f12] border-white/5 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-white">Удалить инструкцию?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-white/50">
              «{articleToDelete?.title || 'Без названия'}» будет удалена без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 px-3 text-[13px] bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted dark:border-white/10 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/5">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (articleToDelete) deleteArticle(articleToDelete.id);
                setArticleToDelete(null);
              }}
              style={{ boxShadow: 'none' }}
              className="h-8 px-3 text-[13px] bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0 hover:translate-y-0 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 [--shadow-primary:none]"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Articles;
