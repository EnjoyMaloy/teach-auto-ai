

# План оптимизации портала — Итерация 2

## Результаты анализа

После детального исследования кодовой базы обнаружены следующие проблемы:

| Проблема | Файлы | Влияние |
|----------|-------|---------|
| Неиспользуемый компонент | `CourseCard.tsx` (109 строк) | Дубликат CourseCardOverlay |
| Неиспользуемые mock-данные | `mockData.ts` (160 строк) | Мёртвый код |
| Тяжёлая анимация фона | `AnimatedBackground.tsx` на 4 страницах | 5 blur-блобов × 4 страницы = постоянная GPU нагрузка |
| Хук используется только в редакторе | `useOverflowDetection.ts` | Можно не трогать — относится к редактору |

## Предлагаемые изменения

### 1. Удалить неиспользуемые файлы

**Удалить:**
- `src/components/catalog/CourseCard.tsx` — нигде не импортируется, полностью заменён на `CourseCardOverlay.tsx`
- `src/lib/mockData.ts` — нигде не используется, остался с ранней разработки

### 2. Оптимизировать AnimatedBackground

Текущий компонент используется на 4 страницах:
- `Home.tsx`
- `Dashboard.tsx`
- `Catalog.tsx`
- `Favorites.tsx`

Каждая страница рендерит 5 больших blur-блобов (800×600, 600×500, 700×550, 400×400, 350×350 px) с CSS-анимациями 12-20 секунд.

**Оптимизация:**
1. Уменьшить количество блобов с 5 до 2
2. Добавить `will-change: transform` для GPU-ускорения
3. Отключить анимации на мобильных устройствах (`prefers-reduced-motion`)
4. Уменьшить размеры блобов для снижения нагрузки на отрисовку

### 3. Страница 404 — локализация

Текст на странице NotFound на английском, хотя весь интерфейс на русском.

**Изменить:**
- "Oops! Page not found" → "Страница не найдена"
- "Return to Home" → "Вернуться на главную"

## Структура изменений

```text
УДАЛИТЬ:
  ├── src/components/catalog/CourseCard.tsx
  └── src/lib/mockData.ts

ИЗМЕНИТЬ:
  ├── src/components/layout/AnimatedBackground.tsx — облегчить
  └── src/pages/NotFound.tsx — локализовать
```

## Оценка эффекта

| Метрика | До | После |
|---------|-----|-------|
| Удалённых строк кода | — | ~270 |
| Blur-блобов на странице | 5 | 2 |
| Анимаций на мобильных | 5 | 0 |

## Техническая реализация

### AnimatedBackground (оптимизированный):

```typescript
const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Основной блоб — центр */}
      <div 
        className="absolute w-[600px] h-[400px] -bottom-[150px] left-1/2 -translate-x-1/2 rounded-full blur-[100px] motion-safe:animate-[blob-float-1_15s_ease-in-out_infinite] will-change-transform"
        style={{ background: 'hsl(270 40% 35% / 0.35)' }}
      />
      {/* Вторичный блоб — справа */}
      <div 
        className="absolute w-[400px] h-[300px] -bottom-[100px] right-[10%] rounded-full blur-[80px] motion-safe:animate-[blob-float-2_20s_ease-in-out_infinite] will-change-transform"
        style={{ background: 'hsl(260 35% 40% / 0.25)' }}
      />
    </div>
  );
};
```

### NotFound (локализованный):

```typescript
return (
  <div className="flex min-h-screen items-center justify-center bg-muted">
    <div className="text-center">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <p className="mb-4 text-xl text-muted-foreground">Страница не найдена</p>
      <a href="/" className="text-primary underline hover:text-primary/90">
        Вернуться на главную
      </a>
    </div>
  </div>
);
```

## Что НЕ трогаем

- `useOverflowDetection.ts` — используется в редакторе (`DesignBlockEditor.tsx`)
- `useImagePreloader.ts` — используется для предзагрузки картинок курсов
- Компоненты редактора — согласно условию задачи

