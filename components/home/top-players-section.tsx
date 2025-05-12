"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Star, ChevronRight, Shield } from 'lucide-react'
import { motion } from "framer-motion"

// Datos de ejemplo para los jugadores
const topPlayers = [
  {
    id: "1",
    firstName: "Carlos",
    lastName: "Martínez",
    category: "1ª",
    score: 980,
    club: "Club Padel Madrid",
    trend: 2,
    winRate: 92,
  },
  {
    id: "2",
    firstName: "Laura",
    lastName: "Sánchez",
    category: "1ª",
    score: 965,
    club: "Padel Indoor Barcelona",
    trend: 1,
    winRate: 89,
  },
  {
    id: "3",
    firstName: "Javier",
    lastName: "Rodríguez",
    category: "1ª",
    score: 940,
    club: "Club Padel Valencia",
    trend: -1,
    winRate: 86,
  },
  {
    id: "4",
    firstName: "Ana",
    lastName: "García",
    category: "2ª",
    score: 920,
    club: "Padel Club Sevilla",
    trend: 3,
    winRate: 84,
  },
  {
    id: "5",
    firstName: "Miguel",
    lastName: "López",
    category: "2ª",
    score: 905,
    club: "Madrid Padel Center",
    trend: 0,
    winRate: 82,
  },
]

// Datos de ejemplo para las parejas
const topPairs = [
  {
    id: "1",
    player1: { firstName: "Carlos", lastName: "Martínez" },
    player2: { firstName: "Miguel", lastName: "López" },
    category: "1ª",
    score: 1250,
    trend: 0,
    winRate: 94,
  },
  {
    id: "2",
    player1: { firstName: "Laura", lastName: "Sánchez" },
    player2: { firstName: "Ana", lastName: "García" },
    category: "1ª",
    score: 1220,
    trend: 2,
    winRate: 91,
  },
  {
    id: "3",
    player1: { firstName: "Javier", lastName: "Rodríguez" },
    player2: { firstName: "David", lastName: "Fernández" },
    category: "1ª",
    score: 1190,
    trend: 1,
    winRate: 88,
  },
]

export default function TopPlayersSection() {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null)

  const getCategoryColor = (categoryId: string) => {
    // Asignar colores según la categoría
    switch (categoryId) {
      case "1ª":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "2ª":
        return "bg-teal-100 text-teal-800 border-teal-200"
      case "3ª":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "4ª":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "5ª":
        return "bg-rose-100 text-rose-800 border-rose-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="h-4 w-4 text-white" />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="bg-gradient-to-r from-slate-300 to-slate-400 w-7 h-7 rounded-full flex items-center justify-center shadow-md">
            <Medal className="h-4 w-4 text-white" />
          </div>
        )
      case 2:
        return (
          <div className="bg-gradient-to-r from-amber-600 to-amber-800 w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
            <Medal className="h-3 w-3 text-white" />
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
            {index + 1}
          </div>
        )
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <span className="text-teal-500">↑{trend}</span>
    } else if (trend < 0) {
      return <span className="text-rose-500">↓{Math.abs(trend)}</span>
    } else {
      return <span className="text-slate-400">-</span>
    }
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-teal-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Ranking de Jugadores</h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Descubre a los mejores jugadores y parejas del momento en nuestro ranking oficial.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs
            defaultValue="individual"
            className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <TabsList className="w-full border-b border-slate-200 bg-slate-50 p-1">
              <TabsTrigger
                value="individual"
                className="flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Ranking Individual
              </TabsTrigger>
              <TabsTrigger
                value="pairs"
                className="flex-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl"
              >
                <Shield className="mr-2 h-5 w-5" />
                Ranking de Parejas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="p-0">
              <div className="overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {topPlayers.map((player, index) => (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="block"
                      onMouseEnter={() => setHoveredPlayer(player.id)}
                      onMouseLeave={() => setHoveredPlayer(null)}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`p-4 flex items-center justify-between ${
                          hoveredPlayer === player.id ? "bg-slate-50" : "bg-white"
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-center">
                          <div className="mr-3">{getMedalIcon(index)}</div>
                          <div>
                            <div className="flex items-center">
                              <div className="font-semibold text-slate-800">
                                {player.firstName} {player.lastName}
                              </div>
                              {index < 3 && (
                                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                                  <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                                  Top 3
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">{player.club}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge className={`${getCategoryColor(player.category)}`}>{player.category}</Badge>
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center">
                              {player.score}
                            </div>
                            <div className="text-sm">{getTrendIcon(player.trend)}</div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                  <Button asChild variant="outline" className="border-slate-200 text-slate-700">
                    <Link href="/ranking" className="flex items-center">
                      Ver ranking completo
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pairs" className="p-0">
              <div className="overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {topPairs.map((pair, index) => (
                    <Link
                      key={pair.id}
                      href={`/pairs/${pair.id}`}
                      className="block"
                      onMouseEnter={() => setHoveredPlayer(`pair-${pair.id}`)}
                      onMouseLeave={() => setHoveredPlayer(null)}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`p-4 flex items-center justify-between ${
                          hoveredPlayer === `pair-${pair.id}` ? "bg-slate-50" : "bg-white"
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-center">
                          <div className="mr-3">{getMedalIcon(index)}</div>
                          <div>
                            <div className="flex items-center">
                              <div className="font-semibold text-slate-800">
                                {pair.player1.firstName} {pair.player1.lastName} / {pair.player2.firstName}{" "}
                                {pair.player2.lastName}
                              </div>
                              {index < 3 && (
                                <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                                  <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                                  Top 3
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">Win rate: {pair.winRate}%</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge className={`${getCategoryColor(pair.category)}`}>{pair.category}</Badge>
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center">
                              {pair.score}
                            </div>
                            <div className="text-sm">{getTrendIcon(pair.trend)}</div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                  <Button asChild variant="outline" className="border-slate-200 text-slate-700">
                    <Link href="/ranking?tab=pairs" className="flex items-center">
                      Ver ranking completo
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  )
}
