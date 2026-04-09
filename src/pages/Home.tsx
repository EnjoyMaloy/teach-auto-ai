import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowUp, Loader2, Gauge, Palette, Sparkles, BookOpen, Star, Zap, ImageOff, ImageIcon, Check, Paperclip, Link, FileText, Upload, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useBaseDesignSystems } from '@/hooks/useBaseDesignSystems';
import { cn } from '@/lib/utils';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { systems: designSystems } = useBaseDesignSystems();
  
  const [prompt, setPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDesignSystemId, setSelectedDesignSystemId] = useState<string | null>(null);
  const [lessonCount, setLessonCount] = useState(3);
  const [skipImages, setSkipImages] = useState(false);
  const [imageModel, setImageModel] = useState<'gemini-3-pro' | 'gemini-3.1-flash' | 'gemini-2.5-flash'>('gemini-3-pro');
  const [mascotMode, setMascotMode] = useState<'fixed' | 'varied'>('fixed');
  const [sourceType, setSourceType] = useState<'none' | 'link' | 'file' | 'md'>('none');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userName = 'Павел';

  const handleGenerate = async () => {
    if (!user) return;

    // MD file → navigate to editor with MD content for AI-powered import
    if (sourceType === 'md' && sourceFile) {
      const mdContent = await sourceFile.text();
      if (!mdContent.trim()) return;
      navigate('/editor/new', {
        state: {
          openAIGenerate: true,
          autoPrompt: '📄 Импорт из MD',
          mdContent,
          generationSettings: {
            designSystemId: selectedDesignSystemId,
            skipImages,
            imageModel,
          },
        },
      });
      return;
    }

    if (!prompt.trim()) return;

    // Navigate to editor with all generation settings
    navigate('/editor/new', {
      state: {
        openAIGenerate: true,
        autoPrompt: prompt.trim(),
        generationSettings: {
          designSystemId: selectedDesignSystemId,
          lessonCount,
          skipImages,
          imageModel,
        },
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const inputCardContent = (
    <>
      <div className="flex items-start gap-3 px-3 md:px-4 py-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Опиши идею курса..."
          className="flex-1 bg-transparent text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/40 resize-none outline-none text-[14px] md:text-[15px] min-h-[24px] max-h-[120px]"
          rows={1}
          style={{ height: 'auto' }}
          onInput={handleTextareaInput}
        />
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <div className="px-3 md:px-4 pb-3 border-t border-border dark:border-white/5">
          <div className="space-y-4 pt-3">
            {/* Design System selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5" />
                Дизайн-система
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {designSystems.map((ds) => {
                  const dsConfig = ds.config;
                  const isSelected = selectedDesignSystemId === ds.id;
                  const primaryHsl = dsConfig.primaryColor;
                  const bgHsl = dsConfig.backgroundColor || '0 0% 100%';
                  const fgHsl = dsConfig.foregroundColor || '0 0% 10%';
                  const btnRadius = dsConfig.buttonStyle === 'pill' ? '9999px' : dsConfig.buttonStyle === 'square' ? '0' : '4px';
                  const db = dsConfig.designBlock;
                  const dot1Hsl = db?.buttonBgColor || primaryHsl;
                  const fifthBg = dsConfig.themeBackgrounds?.[4];
                  const dot2Hsl = fifthBg
                    ? (fifthBg.type === 'solid' ? fifthBg.color || bgHsl : fifthBg.from || bgHsl)
                    : bgHsl;
                  const dot3Hsl = db?.backdropDarkColor || '0 0% 0% / 0.9';

                  return (
                    <button
                      key={ds.id}
                      onClick={() => setSelectedDesignSystemId(selectedDesignSystemId === ds.id ? null : ds.id)}
                      className={cn(
                        "group relative rounded-xl overflow-hidden transition-all duration-200 text-left",
                        isSelected 
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg" 
                          : "ring-1 ring-border/60 hover:ring-border hover:shadow-sm"
                      )}
                      style={{ backgroundColor: `hsl(${bgHsl})` }}
                    >
                      <div className="px-2.5 pt-2.5 pb-2 space-y-2">
                        <p className="text-[11px] font-bold truncate leading-none"
                          style={{ fontFamily: dsConfig.headingFontFamily || dsConfig.fontFamily || 'inherit', color: `hsl(${fgHsl})` }}
                        >{ds.name}</p>
                        <p className="text-[8px] leading-tight opacity-50"
                          style={{ fontFamily: dsConfig.fontFamily || 'inherit', color: `hsl(${fgHsl})` }}
                        >Пример текста</p>
                        <div className="flex items-center justify-between">
                          <div className="h-4 px-2.5 flex items-center justify-center"
                            style={{ backgroundColor: `hsl(${primaryHsl})`, borderRadius: btnRadius,
                              boxShadow: dsConfig.buttonDepth === 'raised' ? `0 2px 0 0 hsl(${primaryHsl} / 0.35)` : 'none' }}
                          >
                            <span className="text-[7px] font-semibold uppercase" style={{ color: `hsl(${dsConfig.primaryForeground || '0 0% 100%'})` }}>Далее</span>
                          </div>
                          <div className="flex items-center -space-x-1.5">
                            <div className="w-4 h-4 rounded-full border border-black/5 z-[3]" style={{ backgroundColor: `hsl(${dot1Hsl})` }} />
                            <div className="w-4 h-4 rounded-full border border-black/5 z-[2]" style={{ backgroundColor: `hsl(${dot2Hsl})` }} />
                            <div className="w-4 h-4 rounded-full border border-black/5 z-[1]" style={{ backgroundColor: `hsl(${dot3Hsl})` }} />
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Illustrations */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <ImageIcon className="w-3.5 h-3.5" />
                Иллюстрации
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setSkipImages(false); setImageModel('gemini-3-pro'); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    !skipImages && imageModel === 'gemini-3-pro'
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Star className="w-3.5 h-3.5" />
                  Детальные
                </button>
                <button
                  onClick={() => { setSkipImages(false); setImageModel('gemini-3.1-flash'); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    !skipImages && imageModel === 'gemini-3.1-flash'
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  NB2
                </button>
                <button
                  onClick={() => { setSkipImages(false); setImageModel('gemini-2.5-flash'); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    !skipImages && imageModel === 'gemini-2.5-flash'
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Быстрые
                </button>
                <button
                  onClick={() => setSkipImages(true)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    skipImages
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <ImageOff className="w-3.5 h-3.5" />
                  Без картинок
                </button>
              </div>
            </div>

            {/* Lesson count - hidden when MD is selected */}
            {sourceType !== 'md' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                Кол-во уроков
              </div>
              <div className="flex gap-1.5">
                {[3, 5, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setLessonCount(count)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-medium transition-all border",
                      lessonCount === count
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Source (optional) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Paperclip className="w-3.5 h-3.5" />
                Источник (опционально)
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSourceType(sourceType === 'link' ? 'none' : 'link')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    sourceType === 'link'
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Link className="w-3.5 h-3.5" />
                  Ссылка
                </button>
                <button
                  onClick={() => setSourceType(sourceType === 'file' ? 'none' : 'file')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    sourceType === 'file'
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Файл
                </button>
                <button
                  onClick={() => setSourceType(sourceType === 'md' ? 'none' : 'md')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium transition-all border",
                    sourceType === 'md'
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  MD
                </button>
              </div>
              {sourceType === 'link' && (
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-muted/30 dark:bg-white/5 border border-border dark:border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              )}
              {sourceType === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSourceFile(file);
                    }}
                  />
                  {sourceFile ? (
                    <div className="flex items-center gap-2 bg-muted/30 dark:bg-white/5 border border-border dark:border-white/10 rounded-xl px-3 py-2">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground truncate flex-1">{sourceFile.name}</span>
                      <button onClick={() => { setSourceFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-muted/30 dark:bg-white/5 border border-dashed border-border dark:border-white/10 rounded-xl px-3 py-3 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      PDF, DOCX, TXT
                    </button>
                  )}
                </div>
              )}
              {sourceType === 'md' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSourceFile(file);
                    }}
                  />
                  {sourceFile ? (
                    <div className="flex items-center gap-2 bg-muted/30 dark:bg-white/5 border border-border dark:border-white/10 rounded-xl px-3 py-2">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground truncate flex-1">{sourceFile.name}</span>
                      <button onClick={() => { setSourceFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-muted/30 dark:bg-white/5 border border-dashed border-border dark:border-white/10 rounded-xl px-3 py-3 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Markdown (.md)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-t border-border dark:border-white/5">
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1 md:gap-1.5">
            {/* Settings toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={cn(
                    "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-colors",
                    showSettings
                      ? "bg-primary/10 text-primary"
                      : "bg-muted dark:bg-white/5 text-muted-foreground dark:text-white/30 hover:bg-muted/80 dark:hover:bg-white/[0.08]"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Настройки генерации
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() && !(sourceType === 'md' && sourceFile)}
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-all",
            (prompt.trim() || (sourceType === 'md' && sourceFile))
              ? "bg-primary dark:bg-white text-primary-foreground dark:text-black hover:bg-primary/90 dark:hover:bg-white/90 cursor-pointer"
              : "bg-muted dark:bg-white/20 cursor-not-allowed"
          )}
        >
          <ArrowUp className={cn(
            "w-4 h-4",
            (prompt.trim() || (sourceType === 'md' && sourceFile))
              ? "text-primary-foreground dark:text-black" 
              : "text-muted-foreground dark:text-white/30"
          )} strokeWidth={2.5} />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="h-16 md:hidden shrink-0" />
      
      <div 
        className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 md:px-6 transition-all duration-200"
        style={{ paddingLeft: '1rem' }}
      >
        <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-semibold mb-6 md:mb-10 text-foreground dark:text-white text-center px-2">
          Чему научим мир сегодня, <span className="text-primary dark:animate-[name-glow_4s_ease-in-out_infinite]" style={{ color: 'hsl(var(--primary))' }}>{userName}</span>?
        </h1>

        <div className="hidden md:block w-full max-w-[700px]">
          <div className="w-full rounded-2xl p-2 transition-all bg-card dark:bg-[#1a1a1b] border border-foreground/20 dark:border-white/[0.08] dark:shadow-2xl">
            {inputCardContent}
          </div>
        </div>
      </div>
      
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-20">
        <div className="w-full rounded-2xl p-2 transition-all bg-card dark:bg-[#1a1a1b] border border-foreground/20 dark:border-white/[0.08] dark:shadow-2xl">
          {inputCardContent}
        </div>
      </div>
      
      <div className="h-[120px] md:hidden shrink-0" />
    </div>
  );
};

export default Home;
