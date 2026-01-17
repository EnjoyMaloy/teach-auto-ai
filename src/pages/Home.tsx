import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Home as HomeIcon, TrendingUp, Users, BookOpen } from 'lucide-react';

const Home: React.FC = () => {
  const stats = [
    { icon: BookOpen, label: 'Активных курсов', value: '12' },
    { icon: Users, label: 'Учеников', value: '1,234' },
    { icon: TrendingUp, label: 'Рост за месяц', value: '+15%' },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Главная</h1>
        <p className="text-muted-foreground mt-1">
          Добро пожаловать в Open Academy
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Welcome Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/30 border-primary/20">
        <CardContent className="py-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
              <HomeIcon className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Начните создавать курсы
              </h2>
              <p className="text-muted-foreground max-w-lg">
                Используйте мастерскую авторов для создания интерактивных курсов. 
                ИИ-ассистент поможет вам на каждом этапе.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Home;
