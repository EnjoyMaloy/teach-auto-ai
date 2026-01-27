import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, CheckCircle2, Star, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import WordMiniCourse from '@/components/dictionary/WordMiniCourse';

interface DictionaryWord {
  id: string;
  term: string;
  definition: string;
  category: string;
  image_url: string | null;
  difficulty_easy_content: any;
  difficulty_medium_content: any;
  difficulty_hard_content: any;
}

interface UserWordProgress {
  word_id: string;
  easy_completed: boolean;
  medium_completed: boolean;
  hard_completed: boolean;
}

const Dictionary: React.FC = () => {
  const { user } = useAuth();
  const [words, setWords] = useState<DictionaryWord[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, UserWordProgress>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedWord, setSelectedWord] = useState<DictionaryWord | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);

  useEffect(() => {
    fetchWords();
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchWords = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('dictionary_words')
        .select('*')
        .order('term');
      
      if (error) throw error;
      setWords((data as DictionaryWord[]) || []);
    } catch (error) {
      console.error('Error fetching words:', error);
      toast.error('Ошибка загрузки словаря');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('user_word_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const progressMap: Record<string, UserWordProgress> = {};
      (data as any[])?.forEach((p: any) => {
        progressMap[p.word_id] = p;
      });
      setUserProgress(progressMap);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const generateWords = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-dictionary', {
        body: { count: 20 }
      });
      
      if (error) throw error;
      toast.success('Словарь успешно сгенерирован!');
      fetchWords();
    } catch (error) {
      console.error('Error generating words:', error);
      toast.error('Ошибка генерации словаря');
    } finally {
      setGenerating(false);
    }
  };

  const getWordProgress = (wordId: string): number => {
    const progress = userProgress[wordId];
    if (!progress) return 0;
    
    let completed = 0;
    if (progress.easy_completed) completed++;
    if (progress.medium_completed) completed++;
    if (progress.hard_completed) completed++;
    
    return Math.round((completed / 3) * 100);
  };

  const getOverallProgress = (): number => {
    if (words.length === 0) return 0;
    
    let totalProgress = 0;
    words.forEach(word => {
      totalProgress += getWordProgress(word.id);
    });
    
    return Math.round(totalProgress / words.length);
  };

  const getNextDifficulty = (wordId: string): 'easy' | 'medium' | 'hard' | null => {
    const progress = userProgress[wordId];
    if (!progress || !progress.easy_completed) return 'easy';
    if (!progress.medium_completed) return 'medium';
    if (!progress.hard_completed) return 'hard';
    return null;
  };

  const handleWordClick = (word: DictionaryWord) => {
    const nextDifficulty = getNextDifficulty(word.id);
    if (nextDifficulty) {
      setSelectedWord(word);
      setSelectedDifficulty(nextDifficulty);
    } else {
      toast.info('Это слово уже изучено!');
    }
  };

  const handleCourseComplete = async (wordId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    if (!user) return;
    
    try {
      const existing = userProgress[wordId];
      
      if (existing) {
        const updates: any = { updated_at: new Date().toISOString(), last_studied_at: new Date().toISOString() };
        updates[`${difficulty}_completed`] = true;
        
        await (supabase as any)
          .from('user_word_progress')
          .update(updates)
          .eq('user_id', user.id)
          .eq('word_id', wordId);
      } else {
        const newProgress: any = {
          user_id: user.id,
          word_id: wordId,
          easy_completed: difficulty === 'easy',
          medium_completed: difficulty === 'medium',
          hard_completed: difficulty === 'hard',
          last_studied_at: new Date().toISOString()
        };
        
        await (supabase as any)
          .from('user_word_progress')
          .insert(newProgress);
      }
      
      fetchUserProgress();
      setSelectedWord(null);
      setSelectedDifficulty(null);
      toast.success(`Уровень "${difficulty === 'easy' ? 'Лёгкий' : difficulty === 'medium' ? 'Средний' : 'Сложный'}" пройден!`);
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Ошибка сохранения прогресса');
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Лёгкий';
      case 'medium': return 'Средний';
      case 'hard': return 'Сложный';
      default: return difficulty;
    }
  };

  const learnedCount = words.filter(w => getWordProgress(w.id) === 100).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Крипто-словарь
              </h1>
            </div>
            <p className="text-muted-foreground ml-13">
              Изучайте термины криптовалют и финансов через интерактивные мини-курсы
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="p-6 mb-8 border-0 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl shadow-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30">
                <BookOpen className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold">Общий прогресс</h2>
                <p className="text-sm text-muted-foreground">
                  Изучено <span className="font-semibold text-primary">{learnedCount}</span> из <span className="font-semibold">{words.length}</span> терминов
                </p>
              </div>
            </div>
            <div className="text-4xl font-display font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              {getOverallProgress()}%
            </div>
          </div>
          <div className="relative">
            <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full transition-all duration-500 ease-out shadow-sm shadow-primary/50"
                style={{ width: `${getOverallProgress()}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Generate Button (for admin) */}
        {words.length === 0 && (
          <Card className="p-10 text-center mb-8 border-0 bg-gradient-to-br from-card to-muted/30 shadow-xl">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-semibold mb-3">Словарь пуст</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Сгенерируйте 20 базовых криптовалютных и финансовых терминов с уникальными иллюстрациями
            </p>
            <Button 
              onClick={generateWords} 
              disabled={generating}
              size="lg"
              className="rounded-xl px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Сгенерировать словарь
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Words Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {words.map((word, index) => {
            const progress = getWordProgress(word.id);
            const isComplete = progress === 100;
            const nextDifficulty = getNextDifficulty(word.id);
            const userProg = userProgress[word.id];
            
            return (
              <Card 
                key={word.id}
                onClick={() => handleWordClick(word)}
                className={`group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/80 ${
                  isComplete ? 'ring-2 ring-green-500/50 shadow-lg shadow-green-500/10' : 'shadow-lg'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Background Image with Overlay */}
                {word.image_url && (
                  <div className="absolute inset-0">
                    <div 
                      className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity duration-300"
                      style={{
                        backgroundImage: `url(${word.image_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                  </div>
                )}
                
                <div className="relative p-5">
                  {/* Category Badge */}
                  <Badge 
                    variant="secondary" 
                    className="mb-3 text-xs font-medium bg-primary/10 text-primary border-0 hover:bg-primary/15"
                  >
                    {word.category}
                  </Badge>
                  
                  {/* Term */}
                  <h3 className="text-lg font-display font-bold mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
                    {word.term}
                    {isComplete && (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </h3>
                  
                  {/* Definition Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {word.definition}
                  </p>
                  
                  {/* Difficulty Stars */}
                  <div className="flex items-center gap-2 mb-4">
                    {['easy', 'medium', 'hard'].map((level, idx) => {
                      const isCompleted = level === 'easy' ? userProg?.easy_completed : 
                                         level === 'medium' ? userProg?.medium_completed : 
                                         userProg?.hard_completed;
                      return (
                        <div 
                          key={level}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            isCompleted 
                              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md shadow-yellow-500/30' 
                              : 'bg-muted/50'
                          }`}
                        >
                          <Star 
                            className={`w-4 h-4 ${isCompleted ? 'fill-white text-white' : 'text-muted-foreground/40'}`} 
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-semibold text-foreground">{progress}%</span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete 
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-r from-primary to-primary/70'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Next Action */}
                  {nextDifficulty && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <span className="text-xs text-primary font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Следующий: {getDifficultyLabel(nextDifficulty)}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Mini Course Modal */}
        {selectedWord && selectedDifficulty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gradient-to-b from-card to-background rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-black/20 border border-border/50 animate-scale-in">
              <div className="p-5 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                <div>
                  <h3 className="font-display font-bold text-xl">{selectedWord.term}</h3>
                  <Badge 
                    className={`mt-2 border-0 ${
                      selectedDifficulty === 'easy' 
                        ? 'bg-green-500/15 text-green-600' 
                        : selectedDifficulty === 'medium' 
                          ? 'bg-yellow-500/15 text-yellow-600' 
                          : 'bg-red-500/15 text-red-600'
                    }`}
                  >
                    {getDifficultyLabel(selectedDifficulty)}
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-xl hover:bg-muted/80"
                  onClick={() => {
                    setSelectedWord(null);
                    setSelectedDifficulty(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <WordMiniCourse
                word={selectedWord}
                difficulty={selectedDifficulty}
                onComplete={() => handleCourseComplete(selectedWord.id, selectedDifficulty)}
                onClose={() => {
                  setSelectedWord(null);
                  setSelectedDifficulty(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dictionary;
