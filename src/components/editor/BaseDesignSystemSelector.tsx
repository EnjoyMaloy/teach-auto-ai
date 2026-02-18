// Theme selector component - synced with parent state (v3 - with mini previews)
import React, { useState } from 'react';
import { BaseDesignSystem } from '@/hooks/useBaseDesignSystems';
import { UserDesignSystem } from '@/hooks/useUserDesignSystems';
import { DesignSystemConfig } from '@/types/designSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Plus, Loader2, Users, User, Wand2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeMiniPreview } from './design-system/ThemeMiniPreview';

interface BaseDesignSystemSelectorProps {
  selectedId: string | null;
  onSelect: (system: BaseDesignSystem | UserDesignSystem, isPersonalTheme: boolean) => void;
  isAdmin: boolean;
  currentConfig?: DesignSystemConfig;
  // Pass base systems from parent to ensure state sync
  baseSystems: BaseDesignSystem[];
  isLoadingBaseSystems: boolean;
  onCreateBaseSystem: (name: string, description: string, config: DesignSystemConfig) => Promise<BaseDesignSystem | null>;
  onUpdateBaseSystem: (id: string, updates: Partial<Omit<BaseDesignSystem, 'id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  onDeleteBaseSystem: (id: string) => Promise<boolean>;
  // Pass user systems from parent to ensure state sync
  userSystems: UserDesignSystem[];
  isLoadingUserSystems: boolean;
  onCreateUserSystem: (name: string, description: string, config: DesignSystemConfig) => Promise<UserDesignSystem | null>;
  onUpdateUserSystem: (id: string, updates: Partial<Omit<UserDesignSystem, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => Promise<boolean>;
  onDeleteUserSystem: (id: string) => Promise<boolean>;
}

export const BaseDesignSystemSelector: React.FC<BaseDesignSystemSelectorProps> = ({
  selectedId,
  onSelect,
  isAdmin,
  currentConfig,
  baseSystems,
  isLoadingBaseSystems,
  onCreateBaseSystem,
  onUpdateBaseSystem,
  onDeleteBaseSystem,
  userSystems,
  isLoadingUserSystems,
  onCreateUserSystem,
  onUpdateUserSystem,
  onDeleteUserSystem,
}) => {

  const [isCreateBaseDialogOpen, setIsCreateBaseDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<{ system: BaseDesignSystem | UserDesignSystem; isBase: boolean } | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<{ system: BaseDesignSystem | UserDesignSystem; isBase: boolean } | null>(null);
  const [newName, setNewName] = useState('');
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isLoading = isLoadingBaseSystems || isLoadingUserSystems;

  const handleCreateBase = async () => {
    if (!newName.trim() || !currentConfig) return;
    
    setIsSaving(true);
    try {
      await onCreateBaseSystem(newName.trim(), '', currentConfig);
      setNewName('');
      setIsCreateBaseDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newName.trim() || !currentConfig) return;
    
    setIsSaving(true);
    try {
      await onCreateUserSystem(newName.trim(), '', currentConfig);
      setNewName('');
      setIsCreateUserDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOpen = (system: BaseDesignSystem | UserDesignSystem, isBase: boolean) => {
    setSelectedForEdit({ system, isBase });
    setEditName(system.name);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedForEdit || !editName.trim()) return;
    
    setIsSaving(true);
    try {
      if (selectedForEdit.isBase) {
        await onUpdateBaseSystem(selectedForEdit.system.id, { 
          name: editName.trim()
        });
      } else {
        await onUpdateUserSystem(selectedForEdit.system.id, { 
          name: editName.trim()
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
        await onDeleteBaseSystem(selectedForDelete.system.id);
      } else {
        await onDeleteUserSystem(selectedForDelete.system.id);
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
            <Users className="w-3.5 h-3.5" />
            <span>Общие темы</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Database-stored base systems */}
            {baseSystems.map((system) => (
              <ThemeCard
                key={system.id}
                system={system}
                isSelected={selectedId === system.id}
                onSelect={() => onSelect(system, false)}
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
                onSelect={() => onSelect(system, true)}
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
      <div className="flex flex-col gap-2 pt-2">
        {isAdmin && (
          <Button
            variant="outline"
            className="w-full justify-between text-sm border-2 border-pink-400 text-pink-600 hover:bg-pink-50 hover:text-pink-700 overflow-hidden"
            onClick={() => setIsCreateBaseDialogOpen(true)}
          >
            <span className="flex items-center gap-2 truncate">
              <Plus className="w-4 h-4 shrink-0" />
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">Добавить общую тему</span>
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-600 border-0 shrink-0 ml-1">
              Admin
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

// Theme card component with mini preview
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
        "relative rounded-xl border-2 transition-all bg-card overflow-hidden cursor-pointer",
        isSelected
          ? "border-primary ring-2 ring-primary/20" 
          : "border-border hover:border-primary/50"
      )}
      onClick={onSelect}
    >
      {/* Mini preview of the theme */}
      <ThemeMiniPreview 
        config={system.config} 
        className="border-0 rounded-none"
      />
      
      {/* Theme name footer */}
      <div className="px-2 py-1.5 bg-card border-t border-border/50 flex items-center justify-between gap-1">
        <p className="text-xs font-medium text-foreground truncate flex-1">{system.name}</p>
        
        {/* Context menu for actions */}
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Действия с темой"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-popover">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="text-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 mr-2" />
                Переименовать
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-xs text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
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
