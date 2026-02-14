

# Синий прогресс-бар с анимацией загрузки

## Что сделаем

### 1. Ускорение: батч 2 -> 4
**Файл: `src/hooks/useGenerateCourse.ts`**
- Изменить `batchSize` с 2 на 4 для параллельной генерации
- Добавить задержку 300ms между батчами

### 2. Показать message шага и прогресс-бар
**Файл: `src/components/editor/EditorAISidebar.tsx`**
- Под названием активного шага "images" показать `step.message` (текст "Создано 3 из 12 иллюстраций")
- Добавить синий прогресс-бар (`Progress`) с анимацией полосатой загрузки (striped animation)
- Прогресс парсится из текста message: регулярка ищет "X/Y" или "X из Y"
- Высота бара: h-2, цвет: синий (`bg-blue-500`), с CSS-анимацией движущихся полос (barberpole/striped effect)

### Визуальный результат

```text
  [spinner] Создание иллюстраций
            Создано 4 из 12
            [=======>  ///////////] синяя полоса с анимацией
```

### Технические детали

**Прогресс-бар** -- компонент `Progress` из `src/components/ui/progress.tsx`. Indicator получит дополнительные классы:
- `bg-blue-500` вместо стандартного `bg-primary`
- CSS background с `repeating-linear-gradient` для полосатого эффекта
- `@keyframes` анимация `progress-stripes` для движения полос слева направо

**Парсинг прогресса** -- функция, которая из строки "Создано 4 из 12 иллюстраций" или "Создано 4/12" извлекает процент (4/12 = 33%).

**Файлы для изменения:**
1. `src/hooks/useGenerateCourse.ts` -- batchSize 2->4, задержка
2. `src/components/editor/EditorAISidebar.tsx` -- message + прогресс-бар
3. `src/index.css` -- keyframes для анимации полос (striped animation)
