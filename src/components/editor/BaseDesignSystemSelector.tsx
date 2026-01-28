import React, { useState } from 'react';
import { BaseDesignSystem, useBaseDesignSystems } from '@/hooks/useBaseDesignSystems';
import { DesignSystemConfig } from '@/types/designSystem';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, Edit, Trash2, Plus, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseDesignSystemSelectorProps {
  selectedId: string | null;
  onSelect: (system: BaseDesignSystem) => void;
  isAdmin: boolean;
  currentConfig?: DesignSystemConfig;
}

export const BaseDesignSystemSelector: React.FC<BaseDesignSystemSelectorProps> = ({
  selectedId,
  onSelect,
  isAdmin,
  currentConfig,
}) => {
  const { systems, isLoading, createSystem, updateSystem, deleteSystem, setDefault } = useBaseDesignSystems();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<BaseDesignSystem | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || !currentConfig) return;
    
    setIsSaving(true);
    try {
      await createSystem(newName.trim(), newDescription.trim(), currentConfig);
      setNewName('');
      setNewDescription('');
      setIsCreateDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfig = async (system: BaseDesignSystem) => {
    if (!currentConfig) return;
    
    setIsSaving(true);
    try {
      await updateSystem(system.id, { config: currentConfig });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    
    setIsSaving(true);
    try {
      await deleteSystem(selectedForDelete.id);
      setSelectedForDelete(null);
      setIsDeleteDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefault(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  // If no systems and not admin, show nothing
  if (systems.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <>
      {/* Systems grid + Create button for admin */}
      <div className="grid grid-cols-2 gap-2">
        {systems.map((system) => (
          <div
            key={system.id}
            className={cn(
              "relative p-3 rounded-xl border-2 transition-all bg-card group cursor-pointer",
              selectedId === system.id
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onSelect(system)}
          >
            {/* Color preview dots */}
            <div className="flex gap-1 mb-2">
              <div 
                className="w-5 h-5 rounded-full border border-border/50"
                style={{ backgroundColor: `hsl(${system.config.primaryColor || '262 83% 58%'})` }}
              />
              <div 
                className="w-5 h-5 rounded-full border border-border/50"
                style={{ backgroundColor: `hsl(${system.config.backgroundColor || '0 0% 100%'})` }}
              />
              <div 
                className="w-5 h-5 rounded-full border border-border/50"
                style={{ backgroundColor: `hsl(${system.config.foregroundColor || '240 10% 4%'})` }}
              />
            </div>
            
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-foreground truncate">{system.name}</p>
              {system.is_default && (
                <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
              )}
            </div>
            
            {selectedId === system.id && (
              <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
            )}

            {/* Admin actions */}
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!system.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefault(system.id);
                    }}
                    className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors"
                    title="Сделать по умолчанию"
                  >
                    <Star className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateConfig(system);
                  }}
                  className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  title="Обновить конфигурацию"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedForDelete(system);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Create button - only for admin */}
        {isAdmin && (
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-all text-left bg-card/50 flex flex-col items-center justify-center gap-1 min-h-[80px]"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Новая тема</span>
          </button>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новую тему</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Например: Корпоративная тема"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание (необязательно)</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Краткое описание темы..."
                rows={2}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Текущие настройки дизайна будут сохранены в эту тему.
              Все пользователи смогут её выбрать.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить тему?</AlertDialogTitle>
            <AlertDialogDescription>
              Тема "{selectedForDelete?.name}" будет удалена. Курсы, использующие эту тему, 
              сохранят свои настройки, но потеряют связь с базовой темой.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BaseDesignSystemSelector;
