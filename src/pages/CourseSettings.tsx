import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Upload, 
  Image as ImageIcon,
  Trash2,
  Settings,
  BarChart3,
  Edit3,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignSystemEditor } from '@/components/editor/DesignSystemEditor';
import { DesignSystemConfig, DEFAULT_DESIGN_SYSTEM } from '@/types/designSystem';
import { CourseDesignSystem } from '@/types/course';

const CourseSettings: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchCourse, saveCourse } = useCourses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [designSystem, setDesignSystem] = useState<DesignSystemConfig>(DEFAULT_DESIGN_SYSTEM);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId || !user) return;
      
      setIsLoading(true);
      const course = await fetchCourse(courseId);
      
      if (course) {
        setTitle(course.title);
        setDescription(course.description || '');
        setShortDescription((course as any).shortDescription || '');
        setTargetAudience(course.targetAudience || '');
        setCoverImage(course.coverImage);
        setTags(course.tags || []);
        setTagsInput((course.tags || []).join(', '));
        
        // Load design system
        if (course.designSystem) {
          setDesignSystem({ ...DEFAULT_DESIGN_SYSTEM, ...course.designSystem });
        }
      } else {
        toast.error('Курс не найден');
        navigate('/');
      }
      
      setIsLoading(false);
    };

    loadCourse();
  }, [courseId, user, fetchCourse, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !courseId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB');
      return;
    }

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${courseId}/banner.${fileExt}`;

      // Delete old banner if exists
      if (coverImage) {
        const oldPath = coverImage.split('/').slice(-3).join('/');
        await supabase.storage.from('course-banners').remove([oldPath]);
      }

      // Upload new banner
      const { error: uploadError } = await supabase.storage
        .from('course-banners')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('course-banners')
        .getPublicUrl(fileName);

      setCoverImage(data.publicUrl);
      toast.success('Баннер загружен');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Ошибка загрузки изображения');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!coverImage || !user || !courseId) return;

    try {
      const path = `${user.id}/${courseId}/banner`;
      await supabase.storage.from('course-banners').remove([path]);
      setCoverImage(undefined);
      toast.success('Баннер удалён');
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const handleSave = async () => {
    if (!courseId) return;

    setIsSaving(true);
    
    const course = await fetchCourse(courseId);
    if (!course) {
      toast.error('Курс не найден');
      setIsSaving(false);
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const success = await saveCourse({
      ...course,
      title,
      description,
      targetAudience,
      coverImage,
      tags: parsedTags,
      designSystem: designSystem as CourseDesignSystem,
    });

    // Update short_description directly
    await supabase
      .from('courses')
      .update({ short_description: shortDescription })
      .eq('id', courseId);

    setIsSaving(false);

    if (success) {
      toast.success('Настройки сохранены');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">{title}</h1>
              <p className="text-sm text-muted-foreground">Настройки курса</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/editor/${courseId}`)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Редактор
            </Button>
            <Button variant="outline" onClick={() => navigate(`/course/${courseId}/stats`)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Статистика
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Сохранить
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="w-4 h-4" />
              Основные
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-2">
              <Palette className="w-4 h-4" />
              Дизайн
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="space-y-6">
              {/* Banner Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Баннер курса
                  </CardTitle>
                  <CardDescription>
                    Рекомендуемый размер: 1200×630 пикселей (16:9)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {coverImage ? (
                    <div className="relative">
                      <img 
                        src={coverImage} 
                        alt="Course banner" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleRemoveImage}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                    >
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Нажмите для загрузки баннера
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Основная информация
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название курса</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Введите название курса"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Короткое описание</Label>
                    <Input
                      id="shortDescription"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Краткое описание для превью (до 100 символов)"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                      {shortDescription.length}/100 символов
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Полное описание</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Подробное описание курса"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Целевая аудитория</Label>
                    <Input
                      id="targetAudience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Например: Начинающие разработчики"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Теги (через запятую)</Label>
                    <Input
                      id="tags"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="React, TypeScript, Frontend"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="design">
            <DesignSystemEditor
              config={designSystem}
              onChange={setDesignSystem}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CourseSettings;
