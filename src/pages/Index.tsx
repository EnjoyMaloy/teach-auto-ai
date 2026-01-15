import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Zap, Users, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIChat } from '@/components/ai-chat/AIChat';
import { CourseStructure } from '@/types/course';
import { cn } from '@/lib/utils';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [generatedCourse, setGeneratedCourse] = useState<CourseStructure | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleCourseGenerated = (structure: CourseStructure) => {
    setGeneratedCourse(structure);
  };

  const handleOpenEditor = () => {
    navigate('/editor/course-1');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-light to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
        
        <nav className="relative z-10 container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">LearnForge</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">Примеры</Button>
            <Button variant="ghost" size="sm">Цены</Button>
            <Button variant="outline" size="sm">Войти</Button>
          </div>
        </nav>

        <div className="relative z-10 container mx-auto px-4 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ai-light text-ai text-sm font-medium mb-6 animate-fade-up">
            <Sparkles className="w-4 h-4" />
            AI-платформа для создания курсов
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Создавайте курсы<br />
            <span className="text-gradient-primary">как Duolingo</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Опишите тему — AI создаст интерактивный курс с квизами, слайдами и геймификацией за минуты
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button size="xl" onClick={() => setShowChat(true)}>
              <Sparkles className="w-5 h-5 mr-2" />
              Создать курс
            </Button>
            <Button variant="outline" size="xl" onClick={handleOpenEditor}>
              <Play className="w-5 h-5 mr-2" />
              Демо редактора
            </Button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Всё для создания курсов
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'AI-генерация',
                description: 'Planner создаёт структуру, Builder — контент, Reviewer проверяет качество',
                color: 'from-ai to-blue-500',
              },
              {
                icon: BookOpen,
                title: '6 типов слайдов',
                description: 'Текст, картинки, выбор ответа, true/false, заполнение пропусков',
                color: 'from-primary to-success',
              },
              {
                icon: Users,
                title: 'Аналитика',
                description: 'Время на слайд, ошибки в квизах, точки выхода учеников',
                color: 'from-warning to-orange-500',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform',
                  feature.color
                )}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-primary to-success p-8 md:p-12 rounded-3xl text-primary-foreground">
            <h2 className="text-3xl font-bold mb-4">Готовы создать свой курс?</h2>
            <p className="text-primary-foreground/80 mb-8">
              Просто опишите тему, и AI сделает всё остальное
            </p>
            <Button 
              size="xl" 
              variant="secondary"
              onClick={() => setShowChat(true)}
              className="bg-white text-primary hover:bg-white/90"
            >
              Начать бесплатно
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* AI Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl h-[600px] animate-scale-in">
            <div className="relative h-full">
              <button
                onClick={() => setShowChat(false)}
                className="absolute -top-12 right-0 text-white hover:text-white/80 transition-colors"
              >
                Закрыть ✕
              </button>
              <AIChat onCourseGenerated={handleCourseGenerated} />
              
              {generatedCourse && (
                <div className="absolute bottom-4 left-4 right-4">
                  <Button size="lg" className="w-full" onClick={handleOpenEditor}>
                    Открыть в редакторе
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
