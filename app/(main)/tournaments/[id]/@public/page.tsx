export default async function PublicTournamentViewPage({ params }: { params: { id: string } }) {
    return <div>Public View for Tournament ID: {await params.id}</div>;
  }