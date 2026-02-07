
# План: Полная замена на оригинальный Sidebar9

## Подход

Беру **весь код из `sidebar9.tsx`** и вставляю как есть, адаптируя только:
1. Интеграцию с `react-router-dom` (вместо `<a href>`)
2. Данные пользователя из `useAuth`
3. Загрузку курсов из Supabase для "Active Projects"

## Что будет сделано

### Файл 1: `src/components/layout/AppSidebar.tsx`

**Полная замена** на код из `sidebar9.tsx` с минимальными адаптациями:

| Оригинал | Адаптация |
|----------|-----------|
| `<a href={item.href}>` | `onClick={() => navigate(item.href)}` |
| `sidebarData.user` (статичный) | Данные из `useAuth()` |
| `sidebarData.workspaces` | Логотип проекта |
| Статичные "Project Alpha/Beta" | Динамические курсы из Supabase |

### Файл 2: `src/components/layout/ProtectedLayout.tsx`

Заменяю на структуру `Sidebar9` из оригинала:

```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <header className="flex h-16 shrink-0 items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Overview</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
    <Outlet />
  </SidebarInset>
</SidebarProvider>
```

## Точное соответствие оригиналу

Все стили сохраняются 1 в 1:
- `font-medium` (не `font-semibold`)
- `text-muted-foreground` (не `text-sidebar-foreground/50`)
- `size-8` (не `h-8 w-8`)
- `variant="floating"` (без `collapsible="icon"`)
- Классы иконки поиска: `left-2 size-4 -translate-y-1/2 opacity-50 select-none`

## Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/components/layout/AppSidebar.tsx` | Полная замена на код sidebar9.tsx |
| `src/components/layout/ProtectedLayout.tsx` | Структура SidebarInset + header из sidebar9.tsx |

## Итог

После замены сайдбар будет **идентичен** shadcnblocks.com:
- Все классы, шрифты, цвета, отступы — точно как в оригинале
- Интеграция с роутингом и авторизацией проекта
- Динамические данные (курсы) вместо статичных проектов
