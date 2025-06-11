import React from 'react';

export default function TournamentsLayout({
  children,
}: {
  children: React.ReactNode;
  player?: React.ReactNode;
  club?: React.ReactNode;
  coach?: React.ReactNode;
}) {
  // Simplified layout - just render children
  // The parallel routes logic will be handled in the main page
  return children;
} 