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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Крипто-словарь</h1>
          <p className="text-muted-foreground">
            Изучайте термины криптовалют и финансов через интерактивные мини-курсы
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Общий прогресс</h2>
                <p className="text-sm text-muted-foreground">
                  Изучено {learnedCount} из {words.length} терминов
                </p>
              </div>
            </div>
            <div className="text-3xl font-bold text-primary">
              {getOverallProgress()}%
            </div>
          </div>
          <Progress value={getOverallProgress()} className="h-3" />
        </Card>

        {/* Generate Button (for admin) */}
        {words.length === 0 && (
          <Card className="p-8 text-center mb-8">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Словарь пуст</h3>
            <p className="text-muted-foreground mb-4">
              Сгенерируйте 20 базовых криптовалютных и финансовых терминов
            </p>
            <Button 
              onClick={generateWords} 
              disabled={generating}
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Сгенерировать словарь
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Words Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {words.map(word => {
            const progress = getWordProgress(word.id);
            const isComplete = progress === 100;
            const nextDifficulty = getNextDifficulty(word.id);
            const userProg = userProgress[word.id];
            
            return (
              <Card 
                key={word.id}
                onClick={() => handleWordClick(word)}
                className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
                  isComplete ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {/* Background Image */}
                {word.image_url && (
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `url(${word.image_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                )}
                
                <div className="relative p-4">
                  {/* Category Badge */}
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {word.category}
                  </Badge>
                  
                  {/* Term */}
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    {word.term}
                    {isComplete && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </h3>
                  
                  {/* Definition Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {word.definition}
                  </p>
                  
                  {/* Difficulty Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    <Star 
                      className={`w-4 h-4 ${userProg?.easy_completed ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                    <Star 
                      className={`w-4 h-4 ${userProg?.medium_completed ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                    <Star 
                      className={`w-4 h-4 ${userProg?.hard_completed ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {/* Next Action */}
                  {nextDifficulty && (
                    <div className="mt-3 text-center">
                      <span className="text-xs text-primary font-medium">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{selectedWord.term}</h3>
                  <Badge variant="outline" className="mt-1">
                    {getDifficultyLabel(selectedDifficulty)}
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
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
