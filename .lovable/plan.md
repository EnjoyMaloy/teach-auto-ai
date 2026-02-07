
# План миграции на единую дизайн-систему

## Цель
Перевести все страницы и компоненты (кроме редактора и runtime) на семантические токены Tailwind CSS, сохраняя анимированный фон `AnimatedBackground` на всех основных страницах.

---

## Текущее состояние

### Страницы с AnimatedBackground
| Страница | AnimatedBackground | Захардкоженный фон |
|----------|-------------------|-------------------|
| Home.tsx | Есть | `bg-[#0f0f12]` |
| Dashboard.tsx | Есть | `bg-[#0f0f12]` |
| Catalog.tsx | Есть | `bg-[#0f0f12]` |
| Favorites.tsx | Есть | `bg-[#0f0f12]` |
| Pricing.tsx | Нет | `bg-background` (уже токен) |
| DesignSystem.tsx | Нет | `bg-[#0f0f12]` |

### Страницы без AnimatedBackground (нужно добавить)
- Pricing.tsx
- DesignSystem.tsx

---

## Маппинг цветов

| Захардкоженный | Замена на токен |
|----------------|-----------------|
| `bg-[#0f0f12]`, `bg-[#0f0f10]` | `bg-background` |
| `bg-[#1a1a1b]` | `bg-card` |
| `text-white` | `text-foreground` |
| `text-white/90` | `text-foreground/90` |
| `text-white/70`, `text-white/60` | `text-muted-foreground` |
| `text-white/40`, `text-white/30`, `text-white/20` | `text-muted-foreground/60`, `/50`, `/30` |
| `border-white/10`, `border-white/[0.08]` | `border-border` |
| `bg-white/10`, `bg-white/5`, `bg-white/[0.02]` | `bg-muted`, `bg-muted/50` |
| `text-[#8D8D8D]` | `text-muted-foreground` |
| `bg-[#F7F7F8]` | `bg-muted` |
| `border-[#EBE9EA]` | `border-border` |

---

## Этапы миграции

### Этап 1: Главные страницы

**1.1 Home.tsx (~15 хардкодов)**
- Заменить `bg-[#0f0f12]` на `bg-background`
- Заменить `bg-[#1a1a1b]` на `bg-card`
- Заменить `text-white` на `text-foreground`
- Заменить `border-white/[0.08]` на `border-border`
- AnimatedBackground уже есть — сохраняем

**1.2 Dashboard.tsx (~25 хардкодов)**
- Заменить фон и текст аналогично
- AlertDialog: `bg-[#1a1a1b]` на `bg-card`
- DropdownMenu: `bg-[#1a1a1b]` на `bg-card`
- CourseCard: `bg-white/[0.02]` на `bg-card/5`
- AnimatedBackground уже есть — сохраняем

**1.3 Catalog.tsx (~20 хардкодов)**
- Аналогичные замены в фильтрах и карточках
- AnimatedBackground уже есть — сохраняем

**1.4 Favorites.tsx (~15 хардкодов)**
- Аналогичные замены
- AnimatedBackground уже есть — сохраняем

### Этап 2: Страницы без AnimatedBackground

**2.1 Pricing.tsx**
- Уже использует семантические токены
- Добавить `AnimatedBackground` для визуальной консистентности

**2.2 DesignSystem.tsx (~10 хардкодов)**
- Добавить `AnimatedBackground`
- Заменить `bg-[#0f0f12]` на `bg-background`
- Заменить `bg-[#1a1a1b]` на `bg-card`
- Заменить `text-white` на `text-foreground`

### Этап 3: Layout-компоненты

**3.1 AppLayout.tsx**
- Заменить `bg-[#0f0f10]` на `bg-background`

**3.2 AppHeader.tsx (~10 хардкодов)**
- Заменить `bg-[#F7F7F8]` на `bg-muted`
- Заменить `text-[#8D8D8D]` на `text-muted-foreground`
- Заменить `border-[#EBE9EA]` на `border-border`

---

## Исключения (НЕ ТРОГАЕМ)

- `src/components/editor/**` — все компоненты редактора
- `src/components/runtime/**` — рантайм курсов (своя дизайн-система)

---

## Пример миграции

**До (Home.tsx):**
```tsx
<div className="min-h-screen bg-[#0f0f12]">
  <div className="bg-[#1a1a1b] border border-white/[0.08]">
    <h1 className="text-white">Заголовок</h1>
    <p className="text-white/40">Описание</p>
  </div>
</div>
```

**После:**
```tsx
<div className="min-h-screen bg-background">
  <div className="bg-card border border-border">
    <h1 className="text-foreground">Заголовок</h1>
    <p className="text-muted-foreground/60">Описание</p>
  </div>
</div>
```

---

## Ожидаемый результат

После миграции:
1. Все страницы будут иметь анимированный градиентный фон
2. Переключение темы в Lovable Design Panel будет корректно менять стили везде
3. Light/dark mode будет работать автоматически на всех страницах
4. Единый источник истины для цветов в `index.css`
5. Редактор и runtime останутся без изменений
