import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Trophy, Calendar, MapPin, Users, Edit } from "lucide-react"
import Link from "next/link"

export default async function PlayerDashboard() {
  const supabase = await createClient()

  // Use getUser() for secure authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>No autorizado</div>
  }

  // Get player data with club information
  const { data: playerData } = await supabase
    .from("players")
    .select(`
      *,
      clubes (
        name
      )
    `)
    .eq("user_id", user.id)
    .single()

  // Get player ranking position
  let playerRanking = null
  if (playerData?.score) {
    const { data: rankingData } = await supabase
      .from("players")
      .select("score")
      .not("score", "is", null)
      .order("score", { ascending: false })

    if (rankingData) {
      const position = rankingData.findIndex(p => p.score <= playerData.score) + 1
      playerRanking = {
        position: position || rankingData.length + 1,
        total: rankingData.length
      }
    }
  }

  // Get upcoming tournaments
  const { data: upcomingTournaments } = await supabase
    .from("tournaments")
    .select(`
      id,
      name,
      start_date,
      end_date,
      status,
      category_name,
      max_participants,
      clubes (
        name,
        address
      )
    `)
    .in("status", ["NOT_STARTED", "IN_PROGRESS"])
    .order("start_date", { ascending: true })
    .limit(3)

  // Get player's tournament inscriptions
  const { data: playerInscriptions } = await supabase
    .from("inscriptions")
    .select(`
      tournament_id,
      tournaments (
        id,
        name,
        start_date,
        status,
        clubes (
          name
        )
      )
    `)
    .eq("player_id", playerData?.id || "")

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { 
      day: "numeric", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Dashboard de Jugador
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Bienvenido, <span className="font-semibold text-green-600">{playerData?.first_name || "Jugador"}</span>. 
            Gestiona tu perfil y mantente al día con los torneos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* MI PERFIL */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center text-white text-lg font-bold">
              <User className="mr-3 h-6 w-6" />
              Mi Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={playerData?.profile_image_url || ""} 
                  alt={`${playerData?.first_name || "Usuario"} ${playerData?.last_name || ""}`}
                />
                <AvatarFallback className="bg-padel-green-100 text-padel-green-700">
                  {playerData?.first_name?.[0] || "U"}
                  {playerData?.last_name?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">
                  {playerData?.first_name || "Nombre"} {playerData?.last_name || "Apellido"}
                </p>
                <p className="text-sm text-gray-600">
                  {playerData?.clubes?.name || "Sin club"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {playerData?.category_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Categoría:</span>
                  <Badge variant="outline" className="bg-padel-green-50 text-padel-green-700 border-padel-green-200">
                    {playerData.category_name}
                  </Badge>
                </div>
              )}
              {playerData?.score && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Puntaje:</span>
                  <span className="font-semibold text-padel-green-700">{playerData.score} pts</span>
                </div>
              )}
            </div>

            <Link href="/edit-profile" className="block">
              <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <Edit className="mr-2 h-5 w-5" />
                Editar Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* MI RANKING */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center text-white text-lg font-bold">
              <Trophy className="mr-3 h-6 w-6" />
              Mi Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {playerData?.score && playerRanking ? (
              <>
                <div className="text-center bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                    #{playerRanking.position}
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    de {playerRanking.total} jugadores
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Puntaje actual:</span>
                    <span className="font-semibold text-padel-green-700">{playerData.score} pts</span>
                  </div>
                  {playerData.category_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Categoría:</span>
                      <Badge variant="outline" className="bg-padel-green-50 text-padel-green-700 border-padel-green-200">
                        {playerData.category_name}
                      </Badge>
                    </div>
                  )}
                </div>
              </>
                         ) : (
               <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                 <Trophy className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                 <p className="text-gray-600 text-sm font-medium">
                   {!playerData?.score ? "Completa tu perfil para aparecer en el ranking" : "Cargando ranking..."}
                 </p>
               </div>
             )}

            <Link href="/ranking" className="block">
              <Button 
                variant="outline" 
                className="w-full border-2 border-yellow-400 text-yellow-700 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-400 hover:text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Ver Ranking Completo
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* PRÓXIMOS TORNEOS */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center text-white text-lg font-bold">
              <Calendar className="mr-3 h-6 w-6" />
              Próximos Torneos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {upcomingTournaments && upcomingTournaments.length > 0 ? (
              <div className="space-y-3">
                {upcomingTournaments.map((tournament) => {
                                     const isInscribed = playerInscriptions?.some(
                     (inscription) => (inscription.tournaments as any)?.id === tournament.id
                   )
                  
                  return (
                                         <div key={tournament.id} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:scale-102">
                       <div className="flex items-start justify-between mb-2">
                         <h4 className="font-medium text-gray-900 text-sm">{tournament.name}</h4>
                         {isInscribed && (
                           <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                             Inscrito
                           </Badge>
                         )}
                       </div>
                       
                       <div className="space-y-1 text-xs text-gray-600">
                         {tournament.start_date && (
                           <div className="flex items-center">
                             <Calendar className="mr-1 h-3 w-3" />
                             {formatDate(tournament.start_date)}
                           </div>
                         )}
                         {(tournament.clubes as any)?.[0]?.name && (
                           <div className="flex items-center">
                             <MapPin className="mr-1 h-3 w-3" />
                             {(tournament.clubes as any)[0].name}
                           </div>
                         )}
                         {tournament.category_name && (
                           <div className="flex items-center">
                             <Trophy className="mr-1 h-3 w-3" />
                             Categoría {tournament.category_name}
                           </div>
                         )}
                       </div>
                     </div>
                  )
                })}
              </div>
                         ) : (
               <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                 <Calendar className="mx-auto h-16 w-16 text-blue-300 mb-4" />
                 <p className="text-gray-700 text-sm font-medium mb-2">
                   No hay torneos próximos disponibles
                 </p>
                 <p className="text-gray-500 text-xs">
                   Revisa la sección de torneos para encontrar competencias
                 </p>
               </div>
             )}

            <Link href="/tournaments" className="block">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <Users className="mr-2 h-5 w-5" />
                Buscar Torneos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

              {/* SECCIÓN ADICIONAL: MIS TORNEOS INSCRITOS */}
        {playerInscriptions && playerInscriptions.length > 0 && (
          <div className="mt-12">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center text-white text-xl font-bold">
                  <Trophy className="mr-3 h-6 w-6" />
                  Mis Torneos Inscritos
                </CardTitle>
              </CardHeader>
                          <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {playerInscriptions.map((inscription) => {
                   const tournament = inscription.tournaments as any;
                   return (
                     <div key={tournament?.id} className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                       <h4 className="font-medium text-gray-900 mb-2">{tournament?.name}</h4>
                       <div className="space-y-1 text-sm text-gray-600">
                         {tournament?.start_date && (
                           <div className="flex items-center">
                             <Calendar className="mr-1 h-4 w-4" />
                             {formatDate(tournament.start_date)}
                           </div>
                         )}
                         {tournament?.clubes?.[0]?.name && (
                           <div className="flex items-center">
                             <MapPin className="mr-1 h-4 w-4" />
                             {tournament.clubes[0].name}
                           </div>
                         )}
                         <Badge 
                           variant="outline" 
                           className={
                             tournament?.status === 'NOT_STARTED' 
                               ? "bg-blue-50 text-blue-700 border-blue-200"
                               : tournament?.status === 'IN_PROGRESS'
                               ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                               : "bg-green-50 text-green-700 border-green-200"
                           }
                         >
                           {tournament?.status === 'NOT_STARTED' && 'Próximo'}
                           {tournament?.status === 'IN_PROGRESS' && 'En Progreso'}
                           {tournament?.status === 'FINISHED' && 'Finalizado'}
                         </Badge>
                       </div>
                       <Link href={`/tournaments/${tournament?.id}`} className="block mt-4">
                         <Button variant="outline" className="w-full border-2 border-green-400 text-green-700 hover:bg-gradient-to-r hover:from-green-400 hover:to-teal-400 hover:text-white font-medium py-2 rounded-lg transition-all duration-300">
                           <Calendar className="mr-2 h-4 w-4" />
                           Ver Detalles
                         </Button>
                       </Link>
                     </div>
                   )
                 })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}
