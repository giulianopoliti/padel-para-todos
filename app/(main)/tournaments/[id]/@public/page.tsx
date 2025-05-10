export default async function PublicTournamentViewPage({ params: { id } }: { params: { id: string } }) {
    return <div>Public View for Tournament ID: {id}</div>;
  }