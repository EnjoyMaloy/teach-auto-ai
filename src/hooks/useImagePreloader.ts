/**
 * useImagePreloader - предзагрузка картинок для слайдов
 * Загружает картинки текущего, следующего и предыдущего слайдов
 */

import { useEffect, useRef } from 'react';
import { Slide } from '@/types/course';
import { SubBlock } from '@/types/designBlock';

// Извлекаем все URL картинок из слайда
const extractImageUrls = (slide: Slide | null | undefined): string[] => {
  if (!slide) return [];
  
  const urls: string[] = [];
  
  // Основная картинка слайда
  if (slide.imageUrl) {
    urls.push(slide.imageUrl);
  }
  
  // Картинки из sub-blocks (design блоки)
  if (slide.subBlocks && Array.isArray(slide.subBlocks)) {
    (slide.subBlocks as SubBlock[]).forEach(subBlock => {
      if (subBlock.imageUrl) {
        urls.push(subBlock.imageUrl);
      }
    });
  }
  
  return urls;
};

// Кэш уже загруженных картинок
const preloadedImages = new Set<string>();

// Предзагрузка одной картинки
const preloadImage = (src: string): Promise<void> => {
  if (preloadedImages.has(src)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      preloadedImages.add(src);
      resolve();
    };
    img.onerror = () => {
      // Даже если ошибка, помечаем как обработанную
      preloadedImages.add(src);
      resolve();
    };
    img.src = src;
  });
};

interface UseImagePreloaderOptions {
  slides: Slide[];
  currentIndex: number;
  preloadAhead?: number; // Сколько слайдов вперёд предзагружать
  preloadBehind?: number; // Сколько слайдов назад
}

export const useImagePreloader = ({
  slides,
  currentIndex,
  preloadAhead = 2,
  preloadBehind = 1,
}: UseImagePreloaderOptions) => {
  const lastPreloadedIndex = useRef<number>(-1);
  
  useEffect(() => {
    if (!slides.length || lastPreloadedIndex.current === currentIndex) return;
    
    lastPreloadedIndex.current = currentIndex;
    
    // Собираем индексы слайдов для предзагрузки
    const indicesToPreload: number[] = [];
    
    // Текущий слайд - приоритет
    indicesToPreload.push(currentIndex);
    
    // Следующие слайды
    for (let i = 1; i <= preloadAhead; i++) {
      if (currentIndex + i < slides.length) {
        indicesToPreload.push(currentIndex + i);
      }
    }
    
    // Предыдущие слайды
    for (let i = 1; i <= preloadBehind; i++) {
      if (currentIndex - i >= 0) {
        indicesToPreload.push(currentIndex - i);
      }
    }
    
    // Собираем все URL картинок
    const allUrls: string[] = [];
    indicesToPreload.forEach(index => {
      const urls = extractImageUrls(slides[index]);
      allUrls.push(...urls);
    });
    
    // Фильтруем уже загруженные
    const urlsToPreload = allUrls.filter(url => !preloadedImages.has(url));
    
    // Предзагружаем
    if (urlsToPreload.length > 0) {
      Promise.all(urlsToPreload.map(preloadImage));
    }
  }, [slides, currentIndex, preloadAhead, preloadBehind]);
};

// Для начальной загрузки всех картинок курса (опционально)
export const preloadCourseImages = (slides: Slide[]): Promise<void[]> => {
  const allUrls: string[] = [];
  slides.forEach(slide => {
    const urls = extractImageUrls(slide);
    allUrls.push(...urls);
  });
  
  const uniqueUrls = [...new Set(allUrls)];
  return Promise.all(uniqueUrls.map(preloadImage));
};
