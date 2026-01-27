

# План: Админ-панель для управления AI-моделями и промптами

## Обзор

Создание защищённой админ-панели, доступной **только** для `trupcgames@gmail.com`, с возможностью:
- Просмотра и переключения AI-моделей для каждой функции
- Просмотра и редактирования всех промптов системы
- Сохранения изменений в базу данных

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│  /admin (новая страница)                                    │
│  ├── AdminLayout с боковым меню                             │
│  ├── Секция "Модели" — просмотр/переключение моделей        │
│  └── Секция "Промпты" — редактор промптов с textarea        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
├─────────────────────────────────────────────────────────────┤
│  Таблица: admin_settings                                    │
│  ├── key: string (уникальный ключ настройки)                │
│  ├── value: jsonb (значение)                                │
│  └── updated_at: timestamp                                  │
├─────────────────────────────────────────────────────────────┤
│  Edge Functions (обновлённые):                              │
│  ├── generate-course — читает модель/промпты из БД          │
│  ├── generate-image — читает модель из БД                   │
│  └── subblock-ai — читает модель/промпты из БД              │
└─────────────────────────────────────────────────────────────┘
```

---

## Детальный план реализации

### Шаг 1: База данных — таблица настроек

Создание таблицы `admin_settings` для хранения конфигурации:

```sql
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS: только admin может читать/писать
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can access settings"
  ON public.admin_settings
  FOR ALL
  USING (
    auth.jwt() ->> 'email' = 'trupcgames@gmail.com'
  );
```

**Начальные данные** (INSERT):
```sql
INSERT INTO admin_settings (key, value) VALUES
  ('models', '{
    "generate_course": "gemini-2.5-pro",
    "generate_image": "gemini-3-pro-image-preview",
    "subblock_ai_text": "gemini-2.5-flash",
    "subblock_ai_image": "gemini-3-pro-image-preview"
  }'),
  ('prompts', '{
    "research": "...", 
    "structure": "...",
    "content": "...",
    "chat": "...",
    "subblock_ai": "..."
  }');
```

---

### Шаг 2: Защита доступа

**Проверка email на фронтенде:**
```typescript
// src/pages/Admin.tsx
const ADMIN_EMAIL = 'trupcgames@gmail.com';

const Admin = () => {
  const { user } = useAuth();
  
  if (user?.email !== ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }
  
  return <AdminPanel />;
};
```

**Проверка на бэкенде (RLS):**
- Таблица `admin_settings` имеет политику, разрешающую доступ только `trupcgames@gmail.com`

---

### Шаг 3: Новые файлы

| Файл | Описание |
|------|----------|
| `src/pages/Admin.tsx` | Главная страница админки |
| `src/components/admin/AdminLayout.tsx` | Layout с боковым меню |
| `src/components/admin/ModelSettings.tsx` | Управление моделями |
| `src/components/admin/PromptEditor.tsx` | Редактор промптов |
| `src/hooks/useAdminSettings.ts` | Hook для работы с настройками |

---

### Шаг 4: Интерфейс админки

**Боковое меню:**
- Модели — список всех функций с текущими моделями
- Промпты — список всех промптов с редактором

**Секция "Модели":**
```text
┌─────────────────────────────────────────────────┐
│ AI Модели                                       │
├─────────────────────────────────────────────────┤
│ Генерация курсов (текст)                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ gemini-2.5-pro                          ▼   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Генерация изображений                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ gemini-3-pro-image-preview              ▼   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Design AI (текст)                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ gemini-2.5-flash                        ▼   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Design AI (картинки)                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ gemini-3-pro-image-preview              ▼   │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Секция "Промпты":**
```text
┌─────────────────────────────────────────────────┐
│ Промпты                                         │
├─────────────────────────────────────────────────┤
│ ◉ Research Prompt                               │
│ ○ Structure Prompt                              │
│ ○ Content Prompt                                │
│ ○ Chat Prompt                                   │
│ ○ Subblock AI Prompt                            │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Ты — исследователь. Твоя задача — собрать  │ │
│ │ ключевые факты по теме для образовательно- │ │
│ │ го курса...                                 │ │
│ │                                             │ │
│ │ [Большой textarea для редактирования]       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│              [ Сохранить изменения ]            │
└─────────────────────────────────────────────────┘
```

---

### Шаг 5: Обновление Edge Functions

Каждая функция при старте будет читать настройки из БД:

```typescript
// В generate-course/index.ts
async function getSettings(supabase: any) {
  const { data: modelData } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'models')
    .single();
    
  const { data: promptData } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'prompts')
    .single();
    
  return {
    model: modelData?.value?.generate_course || 'gemini-2.5-pro',
    prompts: promptData?.value || {}
  };
}
```

**Fallback:** Если настройки не найдены, используются дефолтные значения из кода.

---

### Шаг 6: Маршрутизация

Добавление в `App.tsx`:
```typescript
const Admin = lazy(() => import("./pages/Admin"));

// В Routes:
<Route 
  path="/admin" 
  element={
    <ProtectedRoute>
      <Admin />
    </ProtectedRoute>
  } 
/>
```

---

### Шаг 7: Ссылка в меню (только для админа)

В `AppHeader.tsx` добавить пункт меню "Админка" (виден только при `email === 'trupcgames@gmail.com'`):

```typescript
{user?.email === 'trupcgames@gmail.com' && (
  <DropdownMenuItem onClick={() => navigate('/admin')}>
    <Settings className="w-4 h-4 mr-2" />
    Админка
  </DropdownMenuItem>
)}
```

---

## Доступные модели для выбора

| Модель | Тип | Описание |
|--------|-----|----------|
| `gemini-2.5-pro` | Текст | Максимальное качество, медленнее |
| `gemini-2.5-flash` | Текст | Быстрый, хорошее качество |
| `gemini-2.5-flash-lite` | Текст | Самый быстрый, базовое качество |
| `gemini-3-pro-image-preview` | Картинки | Высокое качество |
| `gemini-2.5-flash-image` | Картинки | Nano Banana — быстрый |

---

## Безопасность

1. **Frontend**: Редирект на главную если `email !== 'trupcgames@gmail.com'`
2. **Backend (RLS)**: Таблица `admin_settings` доступна только этому email
3. **Edge Functions**: Читают настройки через service_role, но записать может только админ через RLS

---

## Список изменений

### Новые файлы:
- `src/pages/Admin.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/ModelSettings.tsx`
- `src/components/admin/PromptEditor.tsx`
- `src/hooks/useAdminSettings.ts`

### Изменяемые файлы:
- `src/App.tsx` — добавить роут `/admin`
- `src/components/layout/AppHeader.tsx` — ссылка на админку для `trupcgames@gmail.com`
- `supabase/functions/generate-course/index.ts` — читать модель/промпты из БД
- `supabase/functions/generate-image/index.ts` — читать модель из БД
- `supabase/functions/subblock-ai/index.ts` — читать модель/промпты из БД

### Миграция БД:
- Создать таблицу `admin_settings`
- Добавить RLS политику
- Заполнить начальными значениями

