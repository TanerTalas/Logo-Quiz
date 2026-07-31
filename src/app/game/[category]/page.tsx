/**
 * Category Specific Game Page
 *
 * Initiates a logo quiz round scoped to a specific brand category (e.g. tech, automotive, food).
 *
 * A Server Component: the slug is checked against the database here, so an unknown
 * category renders the 404 page instead of dropping the player into a broken round.
 * The verified display name is handed to the client so the countdown curtain can
 * show it without waiting for the round request.
 */

import React from 'react';
import { notFound } from 'next/navigation';

import { getCategoryBySlug } from '@/db/queries';
import { QuizGameClient } from '@/components/QuizGameClient';

export interface CategoryGamePageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryGamePage({ params }: CategoryGamePageProps) {
  const { category } = await params;
  const row = await getCategoryBySlug(category);

  if (!row) notFound();

  return <QuizGameClient categorySlug={row.slug} categoryName={row.name} />;
}
