
# План доработки страницы Избранное

## Текущее состояние

### Проблемы

| Проблема | Описание |
|----------|----------|
| Фильтрация по доступности | Запрос содержит `.or('is_published.eq.true,is_link_accessible.eq.true')` — свои черновики не отображаются |
| Нет author_id | В select не запрашивается `author_id`, нельзя определить "мой" это курс или публичный |
| Нет фильтров | Отсутствуют табы "Мои / Публичные" |
| Dashboard без звездочки | Карточки в "Все курсы" (`variant="workshop"`) не имеют кнопки добавления в избранное |

## Изменения

### 1. Обновить запрос в Favorites.tsx

Текущий запрос:
```typescript
.in('id', favorites)
.or('is_published.eq.true,is_link_accessible.eq.true')
```

Новый запрос — получаем ВСЕ курсы из избранного:
```typescript
.in('id', favorites)
.or(`is_published.eq.true,is_link_accessible.eq.true,author_id.eq.${user.id}`)
```

Также добавляем `author_id` в select для фильтрации.

### 2. Добавить фильтры "Все / Мои / Публичные"

```typescript
type FilterType = 'all' | 'mine' | 'public';
const [filter, setFilter] = useState<FilterType>('all');

const filteredCourses = courses.filter(course => {
  if (filter === 'all') return true;
  if (filter === 'mine') return course.authorId === user?.id;
  return course.authorId !== user?.id;
});
```

UI фильтров — аналогично Dashboard и Catalog:
```text
[ Все (5) ] [ Мои (2) ] [ Публичные (3) ]
```

### 3. Добавить звездочку на карточки в Dashboard

Изменить вызов `CourseCardOverlay` в `Dashboard.tsx`:

```tsx
<CourseCardOverlay
  key={course.id}
  id={course.id}
  // ... остальные пропсы
  variant="workshop"
  isFavorite={isFavorite(course.id)}
  onToggleFavorite={() => toggleFavorite(course.id)}
  onDelete={() => setCourseToDelete(course)}
/>
```

### 4. Обновить CourseCardOverlay — показывать звездочку для workshop

Текущая логика:
```typescript
{(variant === 'catalog' || variant === 'favorites') && onToggleFavorite && (
```

Новая логика — добавляем `workshop`:
```typescript
{onToggleFavorite && (
```

Звездочка будет показываться для любого варианта, если передан `onToggleFavorite`.

## Структура изменений

```text
ИЗМЕНИТЬ:
  ├── src/pages/Favorites.tsx
  │     ├── Добавить author_id в select
  │     ├── Изменить фильтр .or() для включения своих курсов
  │     ├── Добавить state для фильтра (all/mine/public)
  │     └── Добавить UI табов фильтрации
  │
  ├── src/pages/Dashboard.tsx
  │     ├── Импортировать useFavorites
  │     └── Добавить isFavorite/onToggleFavorite в CourseCardOverlay
  │
  └── src/components/catalog/CourseCardOverlay.tsx
        └── Показывать звездочку если передан onToggleFavorite
```

## Результат

| Экран | До | После |
|-------|-----|-------|
| Избранное | Только публичные курсы | Мои + публичные с фильтрами |
| Все курсы | Нет звездочки | Звездочка на каждой карточке |

## Техническая реализация

### Favorites.tsx — новая логика

```tsx
type FilterType = 'all' | 'mine' | 'public';

const Favorites: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Запрос с author_id
  const { data } = await supabase
    .from('courses')
    .select(`
      id, title, description, cover_image, 
      estimated_minutes, category, is_published,
      author_id,
      lessons:published_lessons(id)
    `)
    .in('id', favorites)
    .or(`is_published.eq.true,is_link_accessible.eq.true,author_id.eq.${user.id}`);
  
  // Фильтрация
  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'mine') return course.authorId === user?.id;
    return course.authorId !== user?.id;
  });
  
  const counts = {
    all: courses.length,
    mine: courses.filter(c => c.authorId === user?.id).length,
    public: courses.filter(c => c.authorId !== user?.id).length,
  };
  
  // UI
  return (
    <>
      {/* Фильтры */}
      <div className="flex items-center gap-1 mb-6">
        {[
          { id: 'all', label: 'Все' },
          { id: 'mine', label: 'Мои' },
          { id: 'public', label: 'Публичные' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}>
            {f.label} <span>{counts[f.id]}</span>
          </button>
        ))}
      </div>
      
      {/* Карточки */}
      {filteredCourses.map(course => (
        <CourseCardOverlay
          variant={course.authorId === user?.id ? 'workshop' : 'favorites'}
          // ...
        />
      ))}
    </>
  );
};
```

### CourseCardOverlay.tsx — упрощенная логика звездочки

```tsx
{/* Favorite button - show for any variant if handler provided */}
{onToggleFavorite && (
  <button onClick={onToggleFavorite}>
    <Star fill={isFavorite ? 'currentColor' : 'none'} />
  </button>
)}
```
