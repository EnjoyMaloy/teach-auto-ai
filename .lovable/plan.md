

# План: Внедрение Sidebar9 точно по коду shadcnblocks.com

## Текущая проблема

Сейчас в `AppSidebar.tsx` реализация отличается от оригинального Sidebar9:

1. **WorkspaceSwitcher** — используется буква вместо логотипа (`<img>`)
2. **Sidebar variant** — не указан `variant="floating"` (в оригинале есть)
3. **NavMenuItem** — в проекте кастомный компонент, в оригинале другая структура
4. **Стили иконок** — в оригинале `className="size-4"`, у нас без этого класса
5. **ProtectedLayout header** — не добавлен хедер с `SidebarTrigger`, `Separator` и `Breadcrumb` как в Sidebar9

## Что будет сделано

### 1. Полная замена `AppSidebar.tsx`

Скопирую структуру Sidebar9 точь-в-точь, адаптируя только:
- Данные навигации под приложение (Dashboard → Мои курсы и т.д.)
- Интеграцию с `useAuth` и `react-router-dom` для навигации
- Загрузку реальных недавних курсов из Supabase

**Ключевые изменения:**
- `variant="floating"` на компоненте `<Sidebar>`
- `<img>` в WorkspaceSwitcher с логотипом
- `NavMenuItem` — точная копия из Sidebar9 (с Collapsible для подменю)
- Классы `size-4`, `size-6`, `size-8` на иконках как в оригинале

### 2. Обновление `ProtectedLayout.tsx`

Добавлю header внутрь `SidebarInset` как в Sidebar9:

```tsx
<SidebarInset>
  <header className="flex h-16 shrink-0 items-center gap-2 px-4">
    <SidebarTrigger className="-ml-1" />
    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
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
```

### 3. Структура файлов

| Файл | Действие |
|------|----------|
| `src/components/layout/AppSidebar.tsx` | Полная замена на структуру Sidebar9 |
| `src/components/layout/ProtectedLayout.tsx` | Добавить header с SidebarTrigger и Breadcrumb |

---

## Техническая реализация

### WorkspaceSwitcher (оригинал Sidebar9)

```tsx
<div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-primary">
  <img
    src={selected.logo}
    alt={selected.name}
    className="size-6 text-primary-foreground invert dark:invert-0"
  />
</div>
```

### NavMenuItem (оригинал Sidebar9)

```tsx
const NavMenuItem = ({ item }: { item: NavItem }) => {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={item.isActive}>
          <a href={item.href}>
            <Icon className="size-4" />
            <span>{item.label}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen={item.isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={item.isActive}>
            <Icon className="size-4" />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.label}>
                <SidebarMenuSubButton asChild isActive={child.isActive}>
                  <a href={child.href}>{child.label}</a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};
```

### AppSidebar (оригинал Sidebar9)

```tsx
<Sidebar variant="floating" {...props}>
  <SidebarHeader>
    <WorkspaceSwitcher ... />
    <SearchForm />
  </SidebarHeader>
  <SidebarContent>
    {navGroups.map((group) => (
      <SidebarGroup key={group.title}>
        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {group.items.map((item) => (
              <NavMenuItem key={item.label} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    ))}
  </SidebarContent>
  <SidebarFooter>
    <NavUser user={...} />
  </SidebarFooter>
  <SidebarRail />
</Sidebar>
```

---

## Итог

После реализации сайдбар будет выглядеть **точно как на скриншоте** с shadcnblocks.com:
- Floating sidebar с закруглёнными краями
- Workspace switcher с логотипом
- Группы навигации с подменю (Collapsible)
- Header с SidebarTrigger и Breadcrumb
- User footer с dropdown меню

