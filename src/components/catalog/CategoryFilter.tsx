import React from 'react';
import { COURSE_CATEGORIES, CourseCategory } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onSelectCategory 
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {COURSE_CATEGORIES.map(category => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(isSelected ? null : category.id)}
            className={cn(
              "relative p-4 rounded-xl transition-all duration-200",
              "flex flex-col items-center justify-center gap-2 text-center",
              "hover:scale-105 hover:shadow-md",
              "border-2 border-transparent",
              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            style={{ backgroundColor: category.color }}
          >
            <Icon className="w-6 h-6 text-foreground/80" strokeWidth={1.5} />
            <span className="text-xs font-medium text-foreground/80">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
