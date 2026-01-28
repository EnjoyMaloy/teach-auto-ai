import React, { useState } from 'react';
import { BaseDesignSystem, useBaseDesignSystems } from '@/hooks/useBaseDesignSystems';
import { UserDesignSystem, useUserDesignSystems } from '@/hooks/useUserDesignSystems';
import { DesignSystemConfig } from '@/types/designSystem';
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
import { Check, Edit, Trash2, Plus, Loader2, Palette, Users, User, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseDesignSystemSelectorProps {
  selectedId: string | null;
  onSelect: (system: BaseDesignSystem | UserDesignSystem) => void;
  isAdmin: boolean;
  currentConfig?: DesignSystemConfig;
}

export const BaseDesignSystemSelector: React.FC<BaseDesignSystemSelectorProps> = ({
  selectedId,
  onSelect,
  isAdmin,
  currentConfig,
}) => {
  const { 
    systems: baseSystems, 
    isLoading: isLoadingBase, 
    createSystem: createBaseSystem, 
    updateSystem: updateBaseSystem, 
    deleteSystem: deleteBaseSystem,
  } = useBaseDesignSystems();
  
  const { 
    systems: userSystems, 
    isLoading: isLoadingUser, 
    createSystem: createUserSystem, 
    updateSystem: updateUserSystem, 
    deleteSystem: deleteUserSystem 
  } = useUserDesignSystems();

  const [isCreateBaseDialogOpen, setIsCreateBaseDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<{ system: BaseDesignSystem | UserDesignSystem; isBase: boolean } | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<{ system: BaseDesignSystem | UserDesignSystem; isBase: boolean } | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = isLoadingBase || isLoadingUser;

  const handleCreateBase = async () => {
    if (!newName.trim() || !currentConfig) return;
    
    setIsSaving(true);
    try {
      await createBaseSystem(newName.trim(), newDescription.trim(), currentConfig);
      setNewName('');
      setNewDescription('');
      setIsCreateBaseDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newName.trim() || !currentConfig) return;
    
    setIsSaving(true);
    try {
      await createUserSystem(newName.trim(), newDescription.trim(), currentConfig);
      setNewName('');
      setNewDescription('');
      setIsCreateUserDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOpen = (system: BaseDesignSystem | UserDesignSystem, isBase: boolean) => {
    setSelectedForEdit({ system, isBase });
    setEditName(system.name);
    setEditDescription(system.description || '');
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedForEdit || !editName.trim()) return;
    
    setIsSaving(true);
    try {
      if (selectedForEdit.isBase) {
        await updateBaseSystem(selectedForEdit.system.id, { 
          name: editName.trim(), 
          description: editDescription.trim() 
        });
      } else {
        await updateUserSystem(selectedForEdit.system.id, { 
          name: editName.trim(), 
          description: editDescription.trim() 
        });
      }
      setIsEditDialogOpen(false);
      setSelectedForEdit(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    
    setIsSaving(true);
    try {
      if (selectedForDelete.isBase) {
        await deleteBaseSystem(selectedForDelete.system.id);
      } else {
        await deleteUserSystem(selectedForDelete.system.id);
      }
      setSelectedForDelete(null);
      setIsDeleteDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const hasBaseSystems = baseSystems.length > 0;
  const hasUserSystems = userSystems.length > 0;

  // If no systems at all and not admin, still show option to create personal theme
  if (!hasBaseSystems && !hasUserSystems && !isAdmin) {
    return (
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => setIsCreateUserDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <Wand2 className="w-4 h-4" />
          Создать свою тему
        </Button>
        
        {/* User Create Dialog */}
        <CreateThemeDialog
          open={isCreateUserDialogOpen}
          onOpenChange={setIsCreateUserDialogOpen}
          title="Создать свою тему"
          description="Эта тема будет доступна только вам в вашем аккаунте."
          name={newName}
          onNameChange={setNewName}
          descriptionValue={newDescription}
          onDescriptionChange={setNewDescription}
          onSubmit={handleCreateUser}
          isSaving={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Base systems (admin-managed, visible to all) */}
      {hasBaseSystems && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Palette className="w-3.5 h-3.5" />
            <span>Общие темы</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Database-stored base systems */}
            {baseSystems.map((system) => (
              <ThemeCard
                key={system.id}
                system={system}
                isSelected={selectedId === system.id}
                onSelect={() => onSelect(system)}
                isAdmin={isAdmin}
                isBase={true}
                onEdit={() => handleEditOpen(system, true)}
                onDelete={() => {
                  setSelectedForDelete({ system, isBase: true });
                  setIsDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* User systems (personal themes) */}
      {hasUserSystems && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span>Мои темы</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {userSystems.map((system) => (
              <ThemeCard
                key={system.id}
                system={system}
                isSelected={selectedId === system.id}
                onSelect={() => onSelect(system as any)}
                isAdmin={false}
                isBase={false}
                isOwner={true}
                onEdit={() => handleEditOpen(system, false)}
                onDelete={() => {
                  setSelectedForDelete({ system, isBase: false });
                  setIsDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create buttons at the bottom */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        {isAdmin && (
          <Button
            variant="outline"
            className="w-full justify-between text-sm border-2 border-pink-400 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
            onClick={() => setIsCreateBaseDialogOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <Users className="w-4 h-4" />
              Добавить общую тему
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-600 border-0">
              Admin Mode
            </Badge>
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-sm border-2 border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          onClick={() => setIsCreateUserDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <Wand2 className="w-4 h-4" />
          Создать свою тему
        </Button>
      </div>

      {/* Base Create Dialog */}
      <CreateThemeDialog
        open={isCreateBaseDialogOpen}
        onOpenChange={setIsCreateBaseDialogOpen}
        title="Создать общую тему"
        description="Эта тема будет доступна всем пользователям платформы."
        name={newName}
        onNameChange={setNewName}
        descriptionValue={newDescription}
        onDescriptionChange={setNewDescription}
        onSubmit={handleCreateBase}
        isSaving={isSaving}
      />

      {/* User Create Dialog */}
      <CreateThemeDialog
        open={isCreateUserDialogOpen}
        onOpenChange={setIsCreateUserDialogOpen}
        title="Создать свою тему"
        description="Эта тема будет доступна только вам в вашем аккаунте."
        name={newName}
        onNameChange={setNewName}
        descriptionValue={newDescription}
        onDescriptionChange={setNewDescription}
        onSubmit={handleCreateUser}
        isSaving={isSaving}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать тему</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Название темы"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Описание темы"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleEditSave} disabled={isSaving || !editName.trim()}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Сохранить
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
              Тема "{selectedForDelete?.system.name}" будет удалена.
              {selectedForDelete?.isBase && ' Курсы, использующие эту тему, сохранят свои настройки, но потеряют связь с базовой темой.'}
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
    </div>
  );
};

// Theme card component
interface ThemeCardProps {
  system: BaseDesignSystem | UserDesignSystem;
  isSelected: boolean;
  onSelect: () => void;
  isAdmin: boolean;
  isBase: boolean;
  isOwner?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  system,
  isSelected,
  onSelect,
  isAdmin,
  isBase,
  isOwner = false,
  onEdit,
  onDelete,
}) => {
  const canEdit = isBase ? isAdmin : isOwner;

  return (
    <div
      className={cn(
        "relative p-3 rounded-xl border-2 transition-all bg-card group cursor-pointer",
        isSelected
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50"
      )}
      onClick={onSelect}
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
      
      <p className="text-sm font-medium text-foreground truncate">{system.name}</p>
      
      {isSelected && (
        <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
      )}

      {/* Edit actions */}
      {canEdit && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
            title="Редактировать название"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// Create theme dialog component
interface CreateThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  name: string;
  onNameChange: (value: string) => void;
  descriptionValue: string;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

const CreateThemeDialog: React.FC<CreateThemeDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  name,
  onNameChange,
  descriptionValue,
  onDescriptionChange,
  onSubmit,
  isSaving,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="space-y-2">
          <Label>Название</Label>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Например: Моя корпоративная тема"
          />
        </div>
        <div className="space-y-2">
          <Label>Описание (необязательно)</Label>
          <Textarea
            value={descriptionValue}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Краткое описание темы"
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Отмена
        </Button>
        <Button onClick={onSubmit} disabled={isSaving || !name.trim()}>
          {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Создать
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
