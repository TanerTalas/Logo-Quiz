/**
 * Mixed Game Page
 *
 * Initiates a mixed logo quiz round drawing from every category.
 */

import React from 'react';
import { QuizGameClient } from '@/components/QuizGameClient';

export default function MixedGamePage() {
  return <QuizGameClient categoryName="Mixed" />;
}
