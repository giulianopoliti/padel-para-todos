"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy, Medal } from "lucide-react"

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score: number | null
}

interface CoupleInfo {
  id: string
  player_1_info: PlayerInfo | null
  player_2_info: PlayerInfo | null
  points?: number
  gamesWon?: number
  gamesLost?: number
  gameDiff?: number
}

interface ZoneStandingsProps {
  zoneName: string
  couples: CoupleInfo[]
}

export default function ZoneStandings({ zoneName, couples }: ZoneStandingsProps) {
  // Renderizar nombre de pareja
  const renderCoupleName = (couple: CoupleInfo) => {
    const player1Name = `${couple.player_1_info?.first_name || ""} ${couple.player_1_info?.last_name || ""}`.trim()
    const player2Name = `${couple.player_2_info?.first_name || ""} ${couple.player_2_info?.last_name || ""}`.trim()

    return `${player1Name} / ${player2Name}`
  }

  // Modificar el renderPositionIcon para usar colores más suaves
  const renderPositionIcon = (index: number) => {
    if (index === 0) {
      return (
        <div className="bg-gradient-to-r from-teal-400 to-teal-500 w-7 h-7 rounded-full flex items-center justify-center">
          <Trophy className="h-4 w-4 text-white" />
        </div>
      )
    }
    if (index === 1) {
      return (
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 w-7 h-7 rounded-full flex items-center justify-center">
          <Medal className="h-4 w-4 text-white" />
        </div>
      )
    }
    return (
      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
        {index + 1}
      </div>
    )
  }

  // Modificar el Card y CardHeader para usar colores más suaves
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-teal-700">{zoneName}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-200">
              <TableHead className="w-10 text-center font-medium text-slate-600">Pos</TableHead>
              <TableHead className="font-medium text-slate-600">Pareja</TableHead>
              <TableHead className="w-14 text-center font-medium text-slate-600">PTS</TableHead>
              <TableHead className="w-14 text-center font-medium text-slate-600">GF</TableHead>
              <TableHead className="w-14 text-center font-medium text-slate-600">GC</TableHead>
              <TableHead className="w-14 text-center font-medium text-slate-600">DIF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {couples.map((couple, index) => (
              <TableRow
                key={couple.id}
                className={`hover:bg-slate-50 border-b border-slate-100 ${index < 2 ? "bg-teal-50/30" : ""}`}
              >
                <TableCell className="text-center">{renderPositionIcon(index)}</TableCell>
                <TableCell className="font-medium text-slate-700">{renderCoupleName(couple)}</TableCell>
                <TableCell className="text-center font-bold text-teal-600">{couple.points || 0}</TableCell>
                <TableCell className="text-center text-teal-600">{couple.gamesWon || 0}</TableCell>
                <TableCell className="text-center text-blue-600">{couple.gamesLost || 0}</TableCell>
                <TableCell
                  className={`text-center font-medium ${
                    (couple.gameDiff || 0) > 0
                      ? "text-teal-600"
                      : (couple.gameDiff || 0) < 0
                        ? "text-blue-600"
                        : "text-slate-500"
                  }`}
                >
                  {(couple.gameDiff || 0) > 0 ? "+" : ""}
                  {couple.gameDiff || 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
