

# План рефакторинга портала

## Обзор текущего состояния

Проект содержит 14 страниц. После анализа найдены следующие проблемы:

| Проблема | Файл/Место | Влияние |
|----------|------------|---------|
| Неиспользуемая страница | `DesignSystem.tsx` (438 строк) | Мёртвый код в бандле |
| Неиспользуемая edge function | `generate-dictionary/` | Лишние деплои |
| Дублирование хелперов | `getLessonWord`, `getCoursesWord` в 3 файлах | Раздутый код |
| Тяжёлый анимированный фон | `AnimatedBackground.tsx` на всех страницах | CSS-анимации 24/7 |

## Предлагаемые изменения

### 1. Удалить неиспользуемые файлы

**Файлы на удаление:**
- `src/pages/DesignSystem.tsx` — не подключена к роутам, 438 строк мёртвого кода
- `supabase/functions/generate-dictionary/` — функция словаря была удалена

### 2. Вынести общие хелперы

Функции `getLessonWord()` и `getCoursesWord()` дублируются в:
- `Dashboard.tsx`
- `Catalog.tsx`
- `Favorites.tsx`
- `CourseCardOverlay.tsx`

**Решение:** Создать `src/lib/pluralize.ts`:

```text
src/lib/pluralize.ts
├── getLessonWord(count: number): string
├── getCoursesWord(count: number): string
└── pluralize(count, one, few, many): string
```

Удалить локальные копии из страниц.

### 3. Оптимизировать AnimatedBackground

Текущий компонент рендерит 5 больших blur-блобов с CSS-анимациями (12-20 секунд каждая). Это нагружает GPU.

**Варианты:**
1. **Минимум** — отключить анимации на мобильных устройствах
2. **Лёгкая версия** — уменьшить количество блобов с 5 до 2-3
3. **Статичный градиент** — заменить на статичный фон для лучшей производительности

### 4. Общая структура файлов после рефакторинга

```text
УДАЛИТЬ:
  ├── src/pages/DesignSystem.tsx
  └── supabase/functions/generate-dictionary/

СОЗДАТЬ:
  └── src/lib/pluralize.ts

ИЗМЕНИТЬ:
  ├── src/pages/Dashboard.tsx      — убрать getLessonWord
  ├── src/pages/Catalog.tsx        — убрать getLessonWord, getCoursesWord
  ├── src/pages/Favorites.tsx      — убрать getLessonWord, getCoursesWord  
  ├── src/components/catalog/CourseCardOverlay.tsx — импорт из pluralize
  └── src/components/layout/AnimatedBackground.tsx — опционально оптимизация
```

## Оценка эффекта

| Метрика | До | После |
|---------|-----|-------|
| Строк удалённого кода | — | ~500+ |
| Edge functions | 10 | 9 |
| Дублирующегося кода | ~60 строк | 0 |

## Техническая реализация

### Файл `src/lib/pluralize.ts`:

```typescript
export function pluralize(
  count: number,
  one: string,
  few: string,
  many: string
): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;
  
  if (lastTwo >= 11 && lastTwo <= 19) return many;
  if (lastOne === 1) return one;
  if (lastOne >= 2 && lastOne <= 4) return few;
  return many;
}

export const getLessonWord = (count: number) => 
  pluralize(count, 'урок', 'урока', 'уроков');

export const getCoursesWord = (count: number) => 
  pluralize(count, 'курс', 'курса', 'курсов');
```

### Обновление импортов:

```typescript
// Вместо локальной функции:
import { getLessonWord, getCoursesWord } from '@/lib/pluralize';
```

## Дополнительные рекомендации

1. **Неиспользуемые хуки** — проверить `useImagePreloader.ts`, `useOverflowDetection.ts` на использование
2. **Компонент CourseCard** — старый `CourseCard.tsx` можно удалить если используется только `CourseCardOverlay.tsx`
3. **Модерация** — страница доступна только админам, но загружается в бандл для всех (можно рассмотреть динамический импорт)

