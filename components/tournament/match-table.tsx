import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, ClipboardList } from "lucide-react"
import type { MatchTableProps } from "./tournament-types"
import type { AmericanMatch } from "@/types"

export default function MatchTable({ matches, formatDate }: MatchTableProps) {
  return (
    <Tabs defaultValue="matches" className="bg-white rounded-lg shadow-sm border border-slate-100 hover:border-teal-100 transition-all duration-300">
      <TabsList className="w-full border-b border-slate-200 rounded-t-lg bg-slate-50">
        <TabsTrigger
          value="matches"
          className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Partidos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="matches" className="p-0">
        {matches.length > 0 ? (
          <div className="rounded-b-md overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-b border-slate-200">
                  <TableHead className="font-medium text-slate-500">Fecha</TableHead>
                  <TableHead className="font-medium text-slate-500">Ronda</TableHead>
                  <TableHead className="font-medium text-slate-500">Pareja 1</TableHead>
                  <TableHead className="font-medium text-slate-500">Pareja 2</TableHead>
                  <TableHead className="font-medium text-slate-500">Resultado</TableHead>
                  <TableHead className="font-medium text-slate-500">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <TableCell className="text-slate-700">{formatDate(match.date)}</TableCell>
                    <TableCell className="text-slate-700">{match.round}</TableCell>
                    <TableCell className="text-slate-700 font-medium">{match.couple_1.player_1} {match.couple_1.player_2}</TableCell>
                    <TableCell className="text-slate-700 font-medium">{match.couple_2.player_1} {match.couple_2.player_2}</TableCell>
                    <TableCell className="text-slate-700">
                      {/* Display score if available, otherwise show a placeholder */}
                      {('score' in match && typeof match.score === 'string') ? match.score : '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          match.status === "NOT_STARTED"
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            : match.status === "IN_PROGRESS"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : match.status === "FINISHED"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
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
              <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-100">
                <ClipboardList className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-light text-teal-700 mb-2">No hay partidos programados</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                No hay partidos programados todavía para este torneo.
              </p>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
} 