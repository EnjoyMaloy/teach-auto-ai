import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LottieSearchResult {
  id: string;
  name: string;
  previewUrl: string;
  lottieUrl: string;
  author?: string;
}

interface LottieFilesSearchProps {
  onSelect: (lottieUrl: string) => void;
  onClose?: () => void;
  contextHint?: string; // For AI suggestions
}

export const LottieFilesSearch: React.FC<LottieFilesSearchProps> = ({
  onSelect,
  onClose,
  contextHint,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LottieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('lottiefiles-search', {
        body: { query: searchQuery.trim(), limit: 12 },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setResults(data.data || []);
        if (data.data?.length === 0) {
          setError('Анимации не найдены. Попробуйте другой запрос.');
        }
      } else {
        setError(data?.error || 'Ошибка поиска');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Не удалось выполнить поиск');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!contextHint) return;

    setIsAiLoading(true);
    setError(null);

    try {
      // Use AI to generate search keywords based on context
      const { data, error: fnError } = await supabase.functions.invoke('lottiefiles-ai-suggest', {
        body: { context: contextHint },
      });

      if (fnError) throw fnError;

      if (data?.success && data.keyword) {
        setQuery(data.keyword);
        await handleSearch(data.keyword);
      } else {
        setError('Не удалось получить рекомендацию');
      }
    } catch (err) {
      console.error('AI suggest error:', err);
      setError('Ошибка ИИ-подбора');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelect = (result: LottieSearchResult) => {
    setSelectedId(result.id);
    onSelect(result.lottieUrl);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Поиск в LottieFiles</span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="Поиск анимаций..."
            className="pl-8 text-xs h-8"
          />
        </div>
        <Button
          size="sm"
          onClick={() => handleSearch(query)}
          disabled={isLoading || !query.trim()}
          className="h-8 px-3"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Найти'}
        </Button>
      </div>

      {/* AI suggestion button */}
      {contextHint && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAiSuggest}
          disabled={isAiLoading || isLoading}
          className="w-full h-8 text-xs gap-2"
        >
          {isAiLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          ИИ подберёт анимацию
        </Button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive text-center py-2">{error}</p>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <ScrollArea className="h-48">
          <div className="grid grid-cols-3 gap-2 pr-3">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                  selectedId === result.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                {result.previewUrl ? (
                  <img
                    src={result.previewUrl}
                    alt={result.name}
                    className="w-full h-full object-cover bg-muted"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground text-center px-1">
                      {result.name.slice(0, 20)}
                    </span>
                  </div>
                )}
                {selectedId === result.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Empty state */}
      {!isLoading && !error && results.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Введите запрос для поиска</p>
          <p className="text-[10px] opacity-70">Например: rocket, success, loading</p>
        </div>
      )}
    </div>
  );
};
