"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Users } from "lucide-react"
import Link from "next/link"

interface TournamentDetailsTabsProps {
  individualInscriptions: any[]
  coupleInscriptions: any[]
  tournamentId: string
  tournamentStatus: string
}

export default function TournamentDetailsTabs({
  individualInscriptions,
  coupleInscriptions,
  tournamentId,
  tournamentStatus,
}: TournamentDetailsTabsProps) {
  return (
    <>
      <Tabs
        defaultValue="players"
        className="bg-white rounded-lg shadow-sm border border-slate-100 hover:border-teal-100 transition-all duration-300"
      >
        <TabsList className="w-full border-b border-slate-200 rounded-t-lg bg-slate-50">
          <TabsTrigger
            value="players"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
          >
            <Users className="mr-2 h-4 w-4" />
            Jugadores Individuales ({individualInscriptions.length})
          </TabsTrigger>
          <TabsTrigger
            value="couples"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
          >
            <Users className="mr-2 h-4 w-4" />
            Parejas ({coupleInscriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="p-6">
          {individualInscriptions.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="font-medium text-slate-500">Nombre</TableHead>
                  <TableHead className="font-medium text-slate-500">Apellido</TableHead>
                  <TableHead className="font-medium text-slate-500">DNI</TableHead>
                  <TableHead className="font-medium text-slate-500">Teléfono</TableHead>
                  <TableHead className="font-medium text-slate-500">Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {individualInscriptions.map((inscription) => (
                  <TableRow key={inscription.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <TableCell className="text-left font-medium text-slate-700">
                      {inscription.player?.first_name || "—"}
                    </TableCell>
                    <TableCell className="text-left text-slate-700">{inscription.player?.last_name || "—"}</TableCell>
                    <TableCell className="text-left text-slate-700">{inscription.player?.dni || "—"}</TableCell>
                    <TableCell className="text-left text-slate-700">{inscription.player?.phone || "—"}</TableCell>
                    <TableCell className="text-left text-slate-700">{inscription.player?.email || "—"}</TableCell>
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
                Aún no hay jugadores individuales inscritos en este torneo.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="couples" className="p-6">
          {coupleInscriptions.length > 0 ? (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="font-medium text-slate-500">Jugador 1</TableHead>
                  <TableHead className="font-medium text-slate-500">Jugador 2</TableHead>
                  <TableHead className="font-medium text-slate-500">Teléfono J1</TableHead>
                  <TableHead className="font-medium text-slate-500">Teléfono J2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupleInscriptions.map((inscription) => (
                  <TableRow key={inscription.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <TableCell className="text-left font-medium text-slate-700">
                      {inscription.couple?.player_1
                        ? `${inscription.couple.player_1.first_name || ""} ${
                            inscription.couple.player_1.last_name || ""
                          }`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-left text-slate-700">
                      {inscription.couple?.player_2
                        ? `${inscription.couple.player_2.first_name || ""} ${
                            inscription.couple.player_2.last_name || ""
                          }`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-left text-slate-700">
                      {inscription.couple?.player_1?.phone || "—"}
                    </TableCell>
                    <TableCell className="text-left text-slate-700">
                      {inscription.couple?.player_2?.phone || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
                <Users className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-light text-teal-700 mb-2">No hay parejas inscritas</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">Aún no hay parejas inscritas en este torneo.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center gap-4 mt-8">
        <Button
          asChild
          variant="outline"
          className="border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
        >
          <Link href={`/my-tournaments/${tournamentId}/edit`}>
            <Trophy className="mr-2 h-4 w-4" />
            Editar Torneo
          </Link>
        </Button>

        {tournamentStatus === "NOT_STARTED" && (
          <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white">
            <Link href={`/my-tournaments/${tournamentId}/start`}>
              <Trophy className="mr-2 h-4 w-4" />
              Iniciar Torneo
            </Link>
          </Button>
        )}
      </div>
    </>
  )
}
