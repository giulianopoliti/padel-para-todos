import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users } from "lucide-react"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
}

interface RegisteredPlayersProps {
  singlePlayers: PlayerInfo[]
  isLoading: boolean
}

export default function RegisteredPlayers({ singlePlayers, isLoading }: RegisteredPlayersProps) {
  return (
    <Card className="bg-white rounded-lg shadow-sm border border-slate-100 hover:border-teal-100 transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium text-teal-700">Jugadores Inscritos</CardTitle>
      </CardHeader>
      <CardContent>
        {singlePlayers.length > 0 ? (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="font-medium text-slate-500">Nombre</TableHead>
                <TableHead className="font-medium text-slate-500">Apellido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {singlePlayers.map((player) => (
                <TableRow key={player.id} className="hover:bg-slate-50 border-b border-slate-100">
                  <TableCell className="text-left font-medium text-slate-700">{player.first_name || "—"}</TableCell>
                  <TableCell className="text-left text-slate-700">{player.last_name || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
              <Users className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-light text-teal-700 mb-2">No hay jugadores inscritos</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              {isLoading ? "Cargando jugadores..." : "Aún no hay jugadores inscritos en este torneo."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
