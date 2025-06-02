"use client"

import { useState } from "react"
import TournamentBracketVisualization from "./tournament-bracket-visualization"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitFork, Table2 } from "lucide-react"

interface TournamentBracketTabProps {
  tournamentId: string
}

export default function TournamentBracketTab({ tournamentId }: TournamentBracketTabProps) {
  const [viewMode, setViewMode] = useState<"visual" | "table">("visual")

  return (
    <div className="p-8 space-y-6">
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "visual" | "table")} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white border border-gray-200">
            <TabsTrigger value="visual" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <GitFork className="h-4 w-4 mr-2" />
              Vista de Llaves
            </TabsTrigger>
            <TabsTrigger value="table" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Table2 className="h-4 w-4 mr-2" />
              Vista de Tabla
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="mt-6">
            <TournamentBracketVisualization tournamentId={tournamentId} />
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-slate-500">Vista de tabla disponible próximamente</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
