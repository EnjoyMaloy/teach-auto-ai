import React, { useState } from 'react';
import { BadgeItem, BadgeIconType } from '@/types/designBlock';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Plus, Trash2, GripVertical, 
  ImageIcon, X,
  Star, Heart, CheckCircle, Zap, Target, Trophy, 
  Gift, Crown, Flame, Rocket, Lightbulb, ThumbsUp,
  LayoutList, LayoutGrid,
  // Extended icons for AI-generated badges
  BookOpen, Brain, Puzzle, GraduationCap, Award, Gem, Shield, Lock, Unlock,
  Clock, Calendar, MapPin, Mail, User, Users, Settings, Search, Home,
  ArrowRight, ChevronRight, Edit, Download, Share, Link, FileText, Folder,
  Database, Cloud, Code, Bell, MessageCircle, Send, Eye, AlertCircle
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Lucide icons for badges (extended set for AI compatibility)
const LUCIDE_ICON_OPTIONS = [
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'CheckCircle', icon: CheckCircle },
  { name: 'Zap', icon: Zap },
  { name: 'Target', icon: Target },
  { name: 'Trophy', icon: Trophy },
  { name: 'Gift', icon: Gift },
  { name: 'Crown', icon: Crown },
  { name: 'Flame', icon: Flame },
  { name: 'Rocket', icon: Rocket },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'ThumbsUp', icon: ThumbsUp },
  // Extended icons
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Brain', icon: Brain },
  { name: 'Puzzle', icon: Puzzle },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Award', icon: Award },
  { name: 'Gem', icon: Gem },
  { name: 'Shield', icon: Shield },
  { name: 'Eye', icon: Eye },
  { name: 'Clock', icon: Clock },
  { name: 'Calendar', icon: Calendar },
  { name: 'MapPin', icon: MapPin },
  { name: 'Mail', icon: Mail },
  { name: 'User', icon: User },
  { name: 'Users', icon: Users },
  { name: 'Settings', icon: Settings },
  { name: 'Search', icon: Search },
  { name: 'Home', icon: Home },
  { name: 'Bell', icon: Bell },
  { name: 'MessageCircle', icon: MessageCircle },
  { name: 'FileText', icon: FileText },
  { name: 'Database', icon: Database },
  { name: 'Cloud', icon: Cloud },
  { name: 'Code', icon: Code },
  { name: 'AlertCircle', icon: AlertCircle },
];

interface BadgeEditorProps {
  badges: BadgeItem[];
  layout: 'horizontal' | 'vertical';
  onBadgesChange: (badges: BadgeItem[]) => void;
  onLayoutChange: (layout: 'horizontal' | 'vertical') => void;
}

export const BadgeEditor: React.FC<BadgeEditorProps> = ({
  badges,
  layout,
  onBadgesChange,
  onLayoutChange,
}) => {
  const [activeIconPicker, setActiveIconPicker] = useState<string | null>(null);
  
  const maxBadges = layout === 'horizontal' ? 9 : 8;
  const canAddMore = badges.length < maxBadges;

  const addBadge = () => {
    if (!canAddMore) return;
    const newBadge: BadgeItem = {
      id: crypto.randomUUID(),
      text: 'Новый',
      iconType: 'none',
    };
    onBadgesChange([...badges, newBadge]);
  };

  const removeBadge = (id: string) => {
    if (badges.length <= 1) return;
    onBadgesChange(badges.filter(b => b.id !== id));
  };

  const updateBadge = (id: string, updates: Partial<BadgeItem>) => {
    onBadgesChange(badges.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleCustomIconUpload = async (badgeId: string, file: File) => {
    // Validate file size (max 100KB)
    if (file.size > 100 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 100KB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateBadge(badgeId, { iconType: 'custom', iconValue: result });
      setActiveIconPicker(null);
    };
    reader.readAsDataURL(file);
  };

  const renderIconPreview = (badge: BadgeItem) => {
    if (badge.iconType === 'none' || !badge.iconValue) {
      return null;
    }

    if (badge.iconType === 'lucide') {
      const iconOption = LUCIDE_ICON_OPTIONS.find(i => i.name === badge.iconValue);
      if (iconOption) {
        const IconComponent = iconOption.icon;
        return <IconComponent className="w-3.5 h-3.5" />;
      }
    }

    if (badge.iconType === 'custom' && badge.iconValue) {
      return (
        <img 
          src={badge.iconValue} 
          alt="" 
          className="w-3.5 h-3.5 object-contain rounded-sm"
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Layout selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Расположение</Label>
        <div className="flex gap-1">
          <button
            onClick={() => onLayoutChange('horizontal')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors",
              layout === 'horizontal'
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Горизонтально
          </button>
          <button
            onClick={() => onLayoutChange('vertical')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors",
              layout === 'vertical'
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Вертикально
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Макс: {layout === 'horizontal' ? '9' : '8'} бейджей
        </p>
      </div>

      {/* Badge list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            Бейджи ({badges.length}/{maxBadges})
          </Label>
          {canAddMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={addBadge}
              className="h-6 px-2 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Добавить
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {badges.map((badge, index) => (
            <div 
              key={badge.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              
              {/* Icon picker */}
              <Popover 
                open={activeIconPicker === badge.id}
                onOpenChange={(open) => setActiveIconPicker(open ? badge.id : null)}
              >
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors flex-shrink-0",
                      badge.iconType !== 'none' 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {badge.iconType !== 'none' ? (
                      renderIconPreview(badge)
                    ) : (
                      <Plus className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-3">
                    {/* Icon type tabs - emoji removed */}
                    <div className="flex gap-1">
                      {[
                        { type: 'none' as const, label: 'Без' },
                        { type: 'lucide' as const, label: 'Иконки' },
                        { type: 'custom' as const, label: 'Своя' },
                      ].map(({ type, label }) => (
                        <button
                          key={type}
                          onClick={() => {
                            if (type === 'none') {
                              updateBadge(badge.id, { iconType: 'none', iconValue: undefined });
                              setActiveIconPicker(null);
                            } else {
                              // Just switch tab, don't close
                              updateBadge(badge.id, { iconType: type });
                            }
                          }}
                          className={cn(
                            "flex-1 py-1.5 px-2 rounded text-xs transition-colors",
                            badge.iconType === type
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Lucide icons grid */}
                    {badge.iconType === 'lucide' && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Иконки</p>
                        <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                          {LUCIDE_ICON_OPTIONS.map(({ name, icon: Icon }) => (
                            <button
                              key={name}
                              onClick={() => {
                                updateBadge(badge.id, { iconType: 'lucide', iconValue: name });
                                setActiveIconPicker(null);
                              }}
                              className={cn(
                                "w-7 h-7 rounded flex items-center justify-center hover:bg-muted transition-colors",
                                badge.iconValue === name && "bg-primary/20"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom upload */}
                    {badge.iconType === 'custom' && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Своя иконка (макс 100KB)</p>
                        <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleCustomIconUpload(badge.id, file);
                              }
                            }}
                          />
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Загрузить</span>
                        </label>
                      </div>
                    )}

                    {/* Remove icon button */}
                    {badge.iconType !== 'none' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          updateBadge(badge.id, { iconType: 'none', iconValue: undefined });
                          setActiveIconPicker(null);
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Убрать иконку
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Badge text input */}
              <Input
                value={badge.text}
                onChange={(e) => updateBadge(badge.id, { text: e.target.value })}
                className="h-8 text-xs flex-1"
                placeholder="Текст бейджа"
                maxLength={20}
              />

              {/* Remove button */}
              {badges.length > 1 && (
                <button
                  onClick={() => removeBadge(badge.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BadgeEditor;
