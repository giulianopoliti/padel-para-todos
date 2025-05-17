"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Loader2 } from "lucide-react"
import { fetchTournamentZones } from "@/app/api/tournaments/actions"

interface TournamentZonesTabProps {
  tournamentId: string
}

export default function TournamentZonesTab({ tournamentId }: TournamentZonesTabProps) {
  const [activeTab, setActiveTab] = useState("zones")
  const [isLoading, setIsLoading] = useState(true)
  const [zones, setZones] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadZones = async () => {
      try {
        setIsLoading(true)
        const result = await fetchTournamentZones(tournamentId)
        if (result.success && result.zones) {
          setZones(result.zones)
        } else {
          setError(result.error || "Error al cargar las zonas")
        }
      } catch (err) {
        console.error("Error al cargar zonas:", err)
        setError("Ocurrió un error inesperado")
      } finally {
        setIsLoading(false)
      }
    }

    loadZones()
  }, [tournamentId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <span className="ml-2 text-slate-400">Cargando zonas...</span>
      </div>
    )
  }

  if (error) {
    return <div className="bg-rose-50 text-rose-700 p-4 rounded-lg border border-rose-200 text-center">{error}</div>
  }

  if (!zones || zones.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <Users className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-medium text-blue-500 mb-2">No hay zonas creadas</h3>
        <p className="text-slate-400 max-w-md mx-auto text-sm">Aún no se han creado zonas para este torneo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {zones.map((zone) => (
        <Card key={zone.id} className="overflow-hidden border border-slate-200 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 py-3">
            <CardTitle className="text-lg font-medium text-blue-600">{zone.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="font-medium text-slate-400">Pareja</TableHead>
                  <TableHead className="font-medium text-slate-400 text-center">PJ</TableHead>
                  <TableHead className="font-medium text-slate-400 text-center">PG</TableHead>
                  <TableHead className="font-medium text-slate-400 text-center">PP</TableHead>
                  <TableHead className="font-medium text-slate-400 text-center">SF</TableHead>
                  <TableHead className="font-medium text-slate-400 text-center">SC</TableHead>
                  <TableHead className="font-medium text-slate-400 text-center">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {zone.couples &&
                  zone.couples.map((couple: any) => (
                    <TableRow key={couple.id} className="hover:bg-slate-50 border-b border-slate-100">
                      <TableCell className="font-medium text-slate-400">
                        {couple.player1_name} / {couple.player2_name}
                      </TableCell>
                      <TableCell className="text-center !text-slate-100">{couple.stats?.played || 0}</TableCell>
                      <TableCell className="text-center text-slate-400">{couple.stats?.won || 0}</TableCell>
                      <TableCell className="text-center text-slate-400">{couple.stats?.lost || 0}</TableCell>
                      <TableCell className="text-center text-slate-400">{couple.stats?.scored || 0}</TableCell>
                      <TableCell className="text-center text-slate-400">{couple.stats?.conceded || 0}</TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center bg-blue-50 text-blue-600 font-medium rounded-full h-8 w-8 border border-blue-100">
                          {couple.stats?.points || 0}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
