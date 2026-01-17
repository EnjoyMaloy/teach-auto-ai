import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

const Catalog: React.FC = () => {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Каталог курсов</h1>
        <p className="text-muted-foreground mt-1">
          Все доступные курсы на платформе
        </p>
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Каталог скоро будет доступен
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            Здесь появятся опубликованные курсы от всех авторов платформы
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Catalog;
