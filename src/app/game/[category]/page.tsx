'use client';

/**
 * Category Specific Game Page
 * 
 * Initiates a logo quiz round scoped to a specific brand category (e.g. tech, automotive, food).
 */

import React, { use } from 'react';
import { QuizGameClient } from '@/components/QuizGameClient';

export interface CategoryGamePageProps {
  params: Promise<{
    category: string;
  }>;
}

export default function CategoryGamePage({ params }: CategoryGamePageProps) {
  const resolvedParams = use(params);
  return <QuizGameClient categoryId={resolvedParams.category} />;
}
