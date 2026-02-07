/**
 * Russian pluralization helper
 * Handles the three forms: one (1), few (2-4), many (5+, 11-19)
 */
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

export const getLessonWord = (count: number): string => 
  pluralize(count, 'урок', 'урока', 'уроков');

export const getCoursesWord = (count: number): string => 
  pluralize(count, 'курс', 'курса', 'курсов');
