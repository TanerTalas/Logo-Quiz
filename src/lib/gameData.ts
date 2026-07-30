/**
 * Game Data Service
 * 
 * Provides structured categories, logo entries, and round building utilities
 * for the Logo Quiz application.
 */

export interface LogoItem {
  slug: string;
  name: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  logos: LogoItem[];
}

export interface QuestionItem {
  slug: string;
  name: string;
  options: string[];
}

// Full dataset of categories and brand logos used across the quiz
export const CATEGORIES: CategoryItem[] = [
  {
    id: 'tech',
    name: 'Tech & Apps',
    logos: [
      { slug: 'spotify', name: 'Spotify' },
      { slug: 'github', name: 'GitHub' },
      { slug: 'twitch', name: 'Twitch' },
      { slug: 'apple', name: 'Apple' },
      { slug: 'android', name: 'Android' },
      { slug: 'netflix', name: 'Netflix' },
      { slug: 'playstation', name: 'PlayStation' },
      { slug: 'airbnb', name: 'Airbnb' },
      { slug: 'discord', name: 'Discord' },
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive',
    logos: [
      { slug: 'bmw', name: 'BMW' },
      { slug: 'ferrari', name: 'Ferrari' },
      { slug: 'tesla', name: 'Tesla' },
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    logos: [
      { slug: 'mcdonalds', name: "McDonald's" },
      { slug: 'starbucks', name: 'Starbucks' },
      { slug: 'pepsi', name: 'Pepsi' },
    ],
  },
  {
    id: 'brands',
    name: 'Fashion & Retail',
    logos: [
      { slug: 'nike', name: 'Nike' },
      { slug: 'adidas', name: 'Adidas' },
      { slug: 'ubisoft', name: 'Ubisoft' },
    ],
  },
];

// Flat array of all available logos
export const ALL_LOGOS: LogoItem[] = CATEGORIES.flatMap((c) => c.logos);

/**
 * Resolves the logo CDN URL for a given brand slug.
 * Uses SimpleIcons CDN as specified in reference design.
 */
export function getLogoUrl(slug: string): string {
  return `https://cdn.simpleicons.org/${slug}`;
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const list = [...arr];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Retrieves a category object by its ID string.
 */
export function getCategoryById(id: string | null): CategoryItem | undefined {
  if (!id) return undefined;
  return CATEGORIES.find((c) => c.id === id);
}

/**
 * Builds a quiz round with multiple choice options for each logo question.
 */
export function buildQuizRound(catId: string | null, limit: number = 10): QuestionItem[] {
  const cat = getCategoryById(catId);
  const pool = cat ? cat.logos : ALL_LOGOS;
  const selectedLogos = shuffleArray(pool).slice(0, limit);
  const allNames = ALL_LOGOS.map((l) => l.name);

  return selectedLogos.map((logo) => {
    // Pick 3 distractor option names
    const distractors = shuffleArray(allNames.filter((n) => n !== logo.name)).slice(0, 3);
    const options = shuffleArray([logo.name, ...distractors]);
    return {
      slug: logo.slug,
      name: logo.name,
      options,
    };
  });
}

/**
 * Image fallback handler for broken icon loads.
 */
export function handleImageFallback(event: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = event.currentTarget;
  target.style.opacity = '0.4';
}
