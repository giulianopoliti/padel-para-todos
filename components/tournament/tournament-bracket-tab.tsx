"use client"

import { useState } from "react"
import TournamentBracketVisualization from "./tournament-bracket-visualization"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitFork, Table2 } from "lucide-react"
import { Card } from "@/components/ui/card"

interface TournamentBracketTabProps {
  tournamentId: string
}

export default function TournamentBracketTab({ tournamentId }: TournamentBracketTabProps) {
  const [viewMode, setViewMode] = useState<"visual" | "table">("visual")

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "visual" | "table")} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-emerald-100/50">
            <TabsTrigger value="visual" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600">
              <GitFork className="h-4 w-4 mr-2" />
              Vista de Llaves
            </TabsTrigger>
            <TabsTrigger value="table" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600">
              <Table2 className="h-4 w-4 mr-2" />
              Vista de Tabla
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="mt-6">
            <TournamentBracketVisualization tournamentId={tournamentId} />
          </TabsContent>
        </Tabs>
      </Card> 
    </div>
  )
}
