

# План: Изменение структуры сайдбара

## Подход

Используем **существующие компоненты и стили** из текущего `AppSidebar.tsx` — только меняем порядок и содержание секций.

## Новая структура

```text
┌─────────────────────────┐
│  [Logo SVG]             │
├─────────────────────────┤
│  [Avatar] Pavel      ▾  │  → Dropdown: Аккаунт, Уведомления,
│  pavel@email.com        │              Дизайн системы, Выход
├─────────────────────────┤
│  🏠 Главная             │
├─────────────────────────┤
│  МОИ КУРСЫ              │
│  🕐 Недавние        ▸   │  → Collapsible список курсов
│  📁 Все курсы           │
│  ⭐ Избранное           │
├─────────────────────────┤
│  РЕСУРСЫ                │
│  🧭 Исследовать         │
│  📖 Словарь             │
├─────────────────────────┤
│  [🌙/☀️]        [RU ▼]  │
└─────────────────────────┘
```

## Что изменится

| Секция | Было | Станет |
|--------|------|--------|
| Header | WorkspaceSwitcher + SearchForm | Только Logo SVG |
| После Header | — | Профиль с DropdownMenu |
| Content | 4 раздела (Overview, Projects, Team, Workspace) | Главная + Мои курсы + Ресурсы |
| Footer | NavUser | Переключатели темы и языка |

## Технические детали

### Файл: `src/components/layout/AppSidebar.tsx`

**Удаляем:**
- Компонент `WorkspaceSwitcher`
- Компонент `SearchForm`
- Массив `navGroups` с 4 разделами
- Компонент `NavMenuItem`

**Оставляем без изменений:**
- Все импорты UI компонентов
- `useAuth`, `useNavigate`, `useLocation`
- Загрузка `recentCourses` из Supabase
- Функцию `handleSignOut`
- Проверку `isAdmin`

**Добавляем:**
- Импорт `useTheme` из `next-themes`
- Использование `useLanguage` из проекта
- Иконки: `Home`, `Clock`, `Folder`, `Star`, `Compass`, `BookOpen`, `Sun`, `Moon`, `ChevronDown`

### Маршруты меню

| Пункт | Маршрут |
|-------|---------|
| Главная | `/` |
| Все курсы | `/workshop` |
| Избранное | `/favorites` |
| Исследовать | `/catalog` |
| Словарь | `/dictionary` |
| Недавние (курсы) | `/editor/{courseId}` |

### Профиль — DropdownMenu

| Пункт | Действие | Иконка |
|-------|----------|--------|
| Аккаунт | — (пока без действия) | `BadgeCheck` |
| Уведомления | — (пока без действия) | `Bell` |
| Дизайн системы | `navigate('/design-system')` (только для admin) | `Palette` |
| Выход | `handleSignOut()` | `LogOut` |

### Footer — переключатели

| Элемент | Компонент | Логика |
|---------|-----------|--------|
| Тема | `Button` с иконкой `Sun`/`Moon` | `useTheme().setTheme()` |
| Язык | `DropdownMenu` с флагами | `useLanguage().setLanguage()` |

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/components/layout/AppSidebar.tsx` | Переработка структуры (компоненты и стили остаются) |

## Сохраняемые стили

Все классы из текущего sidebar9 остаются:
- `variant="floating"` на `<Sidebar>`
- `size="lg"` на кнопках профиля
- `text-muted-foreground` для подписей
- `font-medium` для заголовков
- `size-4` для иконок
- `rounded-lg` для аватара

