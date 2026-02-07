import React from 'react';
import { COURSE_CATEGORIES } from '@/lib/categories';
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
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {COURSE_CATEGORIES.map(category => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(isSelected ? null : category.id)}
            className={cn(
              "flex-shrink-0 px-4 py-3 rounded-xl transition-all duration-200",
              "flex items-center gap-2",
              "border border-border hover:border-border/80",
              "bg-muted/50 hover:bg-muted",
              isSelected && "bg-primary/20 border-primary/50 text-primary"
            )}
          >
            <div 
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isSelected ? "bg-primary/20" : "bg-muted"
              )}
              style={!isSelected ? { backgroundColor: `${category.color}30` } : undefined}
            >
              <Icon 
                className={cn(
                  "w-4 h-4",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={1.5} 
              />
            </div>
            <span className={cn(
              "text-sm font-medium",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}>
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
