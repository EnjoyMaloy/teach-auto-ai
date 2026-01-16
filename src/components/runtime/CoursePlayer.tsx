import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Trophy, Star, Clock } from 'lucide-react';
import { Course, Lesson, Slide, CourseProgress } from '@/types/course';
import { SlideRenderer } from './SlideRenderer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CoursePlayerProps {
  course: Course;
  onClose: () => void;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, onClose }) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const allSlides = course.lessons.flatMap(lesson => lesson.slides);
  const totalSlides = allSlides.length;
  
  const currentLesson = course.lessons[currentLessonIndex];
  const currentSlide = currentLesson?.slides[currentSlideIndex];

  // Calculate progress
  const completedSlides = course.lessons
    .slice(0, currentLessonIndex)
    .reduce((acc, lesson) => acc + lesson.slides.length, 0) + currentSlideIndex;
  const progress = (completedSlides / totalSlides) * 100;

  const handleAnswer = (isCorrect: boolean) => {
    setTotalAnswers(prev => prev + 1);
    if (isCorrect) setCorrectAnswers(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentSlideIndex < currentLesson.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else if (currentLessonIndex < course.lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
      setCurrentSlideIndex(0);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => prev - 1);
      setCurrentSlideIndex(course.lessons[currentLessonIndex - 1].slides.length - 1);
    }
  };

  if (isCompleted) {
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 100;
    
    return (
      <div className="fixed inset-0 bg-muted/50 z-50 flex items-center justify-center p-4">
        <div className="h-full max-h-[calc(100vh-80px)] w-full max-w-[420px] aspect-[9/16] bg-card rounded-3xl overflow-hidden flex flex-col items-center justify-center border border-border shadow-2xl p-6">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Курс пройден! 🎉</h1>
            <p className="text-muted-foreground text-sm mb-6">{course.title}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <Star className="w-5 h-5 text-warning mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{accuracy}%</p>
                <p className="text-xs text-muted-foreground">Точность</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{course.estimatedMinutes}</p>
                <p className="text-xs text-muted-foreground">Минут</p>
              </div>
            </div>

            <Button size="lg" onClick={onClose} className="w-full">
              Завершить
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-muted/50 z-50 flex items-center justify-center p-4">
      {/* Close button outside phone */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors shadow-lg"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Mobile phone frame */}
      <div className="h-full max-h-[calc(100vh-80px)] w-full max-w-[420px] aspect-[9/16] bg-card rounded-3xl overflow-hidden flex flex-col border border-border shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <div className="text-sm font-medium text-muted-foreground">
            {completedSlides + 1} / {totalSlides}
          </div>

          <div className="flex-1 max-w-[200px] mx-4">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-success transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {correctAnswers > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                <Star className="w-3 h-3" />
                {correctAnswers}
              </div>
            )}
          </div>
        </header>

        {/* Lesson indicator */}
        <div className="px-4 py-2 bg-muted/30 border-b border-border shrink-0">
          <p className="text-xs text-center">
            <span className="text-muted-foreground">Урок {currentLessonIndex + 1}:</span>
            <span className="font-medium text-foreground ml-1">{currentLesson?.title}</span>
          </p>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4">
          {currentSlide && (
            <SlideRenderer
              key={currentSlide.id}
              slide={currentSlide}
              onAnswer={handleAnswer}
              onNext={handleNext}
            />
          )}
        </main>

        {/* Navigation */}
        <footer className="px-4 py-3 border-t border-border bg-card flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentLessonIndex === 0 && currentSlideIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Назад
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
          >
            Далее
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </footer>
      </div>
    </div>
  );
};
