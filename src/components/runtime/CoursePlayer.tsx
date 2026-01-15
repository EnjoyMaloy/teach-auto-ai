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
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-success-light flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Курс пройден! 🎉</h1>
          <p className="text-muted-foreground mb-8">{course.title}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <Star className="w-6 h-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Точность</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <Clock className="w-6 h-6 text-ai mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{course.estimatedMinutes}</p>
              <p className="text-sm text-muted-foreground">Минут</p>
            </div>
          </div>

          <Button size="xl" onClick={onClose}>
            Завершить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <button 
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex-1 max-w-md mx-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-success transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="text-sm font-medium text-muted-foreground">
          {completedSlides + 1} / {totalSlides}
        </div>
      </header>

      {/* Lesson indicator */}
      <div className="px-4 py-2 bg-muted/50 border-b border-border">
        <p className="text-sm text-center">
          <span className="text-muted-foreground">Урок {currentLessonIndex + 1}:</span>
          <span className="font-medium text-foreground ml-1">{currentLesson?.title}</span>
        </p>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
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
      <footer className="px-4 py-3 border-t border-border bg-card flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentLessonIndex === 0 && currentSlideIndex === 0}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Назад
        </Button>

        <div className="flex items-center gap-2">
          {correctAnswers > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-success-light text-success text-sm font-medium">
              <Star className="w-4 h-4" />
              {correctAnswers}
            </div>
          )}
        </div>

        <div className="w-24" /> {/* Spacer */}
      </footer>
    </div>
  );
};
