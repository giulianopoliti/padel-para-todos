import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PlayerDashboard() {
  const supabase = await createClient()

  // Use getUser() for secure authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get player data
  const { data: playerData } = await supabase.from("players").select("*").eq("user_id", user?.id).single()
  console.log("playerData", playerData);
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-padel-green-700 mb-6">Dashboard de Jugador</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mi Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {playerData
                ? `Bienvenido, ${playerData.first_name || "Jugador"} ${playerData.last_name || ""}`
                : "Completa tu perfil para comenzar"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Torneos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">No estás inscrito en ningún torneo actualmente.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
