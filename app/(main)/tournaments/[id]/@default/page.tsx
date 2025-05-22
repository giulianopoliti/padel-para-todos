import React from 'react';

// This is the actual default content for the /tournaments/[id] route,
// rendered via the @default slot in the layout.
export default function DefaultTournamentPage() {
  console.log('[@default/page.tsx] Rendering default slot page.');
  return (
    <div>
      <p>Default content for tournament ID page. Please select a view based on your role.</p>
      <p>If you are seeing this, the role-based routing might not have matched.</p>
    </div>
  );
} 