// app/(main)/tournaments/[id]/page.tsx

// This page is part of a parallel routes setup.
// The actual content display is handled by @user/page.tsx or @club/page.tsx via layout.tsx.
// This page can be used for fetching data common to all views or can return null if
// all data fetching and UI are handled within the specific parallel route pages.

// For now, returning null to prevent rendering of old UI.
export default function TournamentPage() {
  // console.log("Rendering main app/(main)/tournaments/[id]/page.tsx - should be null or minimal");
  return null;
}

