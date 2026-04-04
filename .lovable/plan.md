

# Раздел «Инструкции» + блок-статья в редакторе

## Что делаем

1. Новая таблица `articles` — хранит статьи пользователя (rich text HTML)
2. Страница `/articles` — список статей с кнопкой «Создать инструкцию», редактирование через RichTextEditor
3. Новый тип блока `article` в редакторе курсов — выбираешь статью из списка, она отображается как прокручиваемый контент внутри слайда
4. Пункт «Инструкции» в сайдбаре (секция «Мои курсы»)

## Структура

```text
Сайдбар:
  Мои курсы
    ├── Недавние
    ├── Все курсы
    ├── Избранное
    └── Инструкции  ← NEW

Страница /articles:
  [+ Создать инструкцию]
  ┌──────────────────┐
  │ Статья 1         │  → клик → редактор статьи
  │ Статья 2         │
  └──────────────────┘

Редактор статьи:
  [Заголовок]
  [RichTextEditor — полноценный]
  [Сохранить]

Редактор курса → BlockTypeSelector:
  Контент: ... + «Статья» (иконка FileText)

Блок article в слайде:
  Выбор статьи из dropdown → контент рендерится
  с прокруткой внутри слайда
```

## Технические изменения

### 1. Миграция БД — таблица `articles`

```sql
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- RLS: пользователь видит и управляет только своими
CREATE POLICY "Users can CRUD own articles"
  ON public.articles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Добавить колонку `article_id UUID` в таблицу `slides` и `published_slides` для ссылки на статью.

### 2. Типы — добавить `article` в `SlideType` и `BlockType`

- `src/types/course.ts` — добавить `'article'` в `SlideType`, добавить `articleId?: string` в `Slide`
- `src/types/blocks.ts` — добавить `'article'` в `BlockType`, конфиг в `BLOCK_CONFIGS`, обновить `createEmptyBlock`

### 3. Страница `src/pages/Articles.tsx`

- Список статей пользователя (fetch из `articles`)
- Кнопка «Создать инструкцию» — создаёт пустую запись, переходит к редактированию
- Inline-редактирование: заголовок (input) + RichTextEditor для контента
- Автосохранение или кнопка «Сохранить»
- Удаление статьи

### 4. Роутинг — `src/App.tsx`

- Добавить `/articles` в protected routes с layout

### 5. Сайдбар — `AppSidebar.tsx`

- Добавить пункт «Инструкции» (иконка `FileText`) в секцию «Мои курсы» после «Избранное»

### 6. Редактор курса — блок `article`

- `BlockTypeSelector.tsx` — добавить иконку FileText в iconMap, блок появится в секции «Контент»
- `BlockEditor.tsx` — обработка типа `article`: dropdown для выбора статьи из списка пользователя
- `SlideRenderer.tsx` — рендеринг блока `article`: загрузка контента статьи по `articleId`, отображение HTML в прокручиваемом контейнере

### 7. Публикация — `usePublishing.tsx`

- При публикации копировать `article_id` в `published_slides`

### Изменяемые/создаваемые файлы

- Миграция БД (новая таблица + колонки)
- `src/types/course.ts` — SlideType + articleId
- `src/types/blocks.ts` — BlockType + config
- `src/pages/Articles.tsx` (новый)
- `src/App.tsx` — роут
- `src/components/layout/AppSidebar.tsx` — пункт меню
- `src/components/editor/blocks/BlockTypeSelector.tsx` — иконка
- `src/components/editor/blocks/BlockEditor.tsx` — UI выбора статьи
- `src/components/runtime/SlideRenderer.tsx` — рендеринг article
- `src/hooks/usePublishing.tsx` — article_id в published_slides

