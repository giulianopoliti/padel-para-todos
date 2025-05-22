'use client';

import React from 'react';

// This component should ideally not be rendered if a specific slot is matched.
// It serves as a fallback for the main segment page.
export default function TournamentIdPage() {
  console.log('[TournamentIdPage] Rendering fallback page.');
  return null;
}