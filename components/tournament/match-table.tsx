import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "lucide-react"
import type { MatchTableProps } from "./tournament-types"
import type { AmericanMatch } from "@/types"

export default function MatchTable({ matches, formatDate }: MatchTableProps) {
  return (
    <Tabs defaultValue="matches" className="bg-white rounded-lg shadow-md">
      <TabsList className="w-full border-b border-gray-200 rounded-t-lg bg-padel-green-50">
        <TabsTrigger
          value="matches"
          className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Partidos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="matches" className="p-0">
        {matches.length > 0 ? (
          <div className="rounded-b-md overflow-hidden">
            <Table>
              <TableHeader className="bg-padel-green-50">
                <TableRow>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Ronda</TableHead>
                  <TableHead className="font-semibold">Pareja 1</TableHead>
                  <TableHead className="font-semibold">Pareja 2</TableHead>
                  <TableHead className="font-semibold">Resultado</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id} className="hover:bg-padel-green-50">
                    <TableCell>{formatDate(match.date)}</TableCell>
                    <TableCell>{match.round}</TableCell>
                    <TableCell>{match.couple_1.player_1} {match.couple_1.player_2}</TableCell>
                    <TableCell>{match.couple_2.player_1} {match.couple_2.player_2}</TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          match.status === "NOT_STARTED"
                            ? "bg-yellow-100 text-yellow-800"
                            : match.status === "IN_PROGRESS"
                              ? "bg-padel-green-100 text-padel-green-800"
                              : match.status === "FINISHED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {match.status === "NOT_STARTED"
                          ? "Programado"
                          : match.status === "IN_PROGRESS"
                            ? "En curso"
                            : match.status === "FINISHED"
                              ? "Completado"
                              : match.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="py-12 px-4">
              <Calendar className="h-12 w-12 text-padel-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-padel-green-700 mb-2">No hay partidos programados</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No hay partidos programados todavía para este torneo.
              </p>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
} 