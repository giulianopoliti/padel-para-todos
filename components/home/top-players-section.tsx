"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Star, ChevronRight, Shield, Crown, Zap, TrendingUp } from 'lucide-react'

export default function TopPlayersSection() {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null)

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
      avatar: "/placeholder.svg?height=80&width=80"
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
      avatar: "/placeholder.svg?height=80&width=80"
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
      avatar: "/placeholder.svg?height=80&width=80"
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
      avatar: "/placeholder.svg?height=80&width=80"
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
      avatar: "/placeholder.svg?height=80&width=80"
    },
  ]

  const topPairs = [
    {
      id: "1",
      player1: { firstName: "Carlos", lastName: "Martínez", avatar: "/placeholder.svg?height=60&width=60" },
      player2: { firstName: "Miguel", lastName: "López", avatar: "/placeholder.svg?height=60&width=60" },
      category: "1ª",
      score: 1250,
      trend: 0,
      winRate: 94,
    },
    {
      id: "2",
      player1: { firstName: "Laura", lastName: "Sánchez", avatar: "/placeholder.svg?height=60&width=60" },
      player2: { firstName: "Ana", lastName: "García", avatar: "/placeholder.svg?height=60&width=60" },
      category: "1ª",
      score: 1220,
      trend: 2,
      winRate: 91,
    },
    {
      id: "3",
      player1: { firstName: "Javier", lastName: "Rodríguez", avatar: "/placeholder.svg?height=60&width=60" },
      player2: { firstName: "David", lastName: "Fernández", avatar: "/placeholder.svg?height=60&width=60" },
      category: "1ª",
      score: 1190,
      trend: 1,
      winRate: 88,
    },
  ]

  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
      case "1ª":
        return "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
      case "2ª":
        return "bg-gradient-to-r from-teal-400 to-teal-500 text-white"
      case "3ª":
        return "bg-gradient-to-r from-blue-400 to-blue-500 text-white"
      default:
        return "bg-gradient-to-r from-slate-400 to-slate-500 text-white"
    }
  }

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl">
              <Crown className="h-6 w-6 text-white drop-shadow-sm" />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
            <Medal className="h-5 w-5 text-white" />
          </div>
        )
      case 2:
        return (
          <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 w-9 h-9 rounded-lg flex items-center justify-center shadow-md">
            <Medal className="h-4 w-4 text-white" />
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-300">
            {index + 1}
          </div>
        )
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return (
        <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          <TrendingUp className="h-3 w-3 mr-1" />
          <span className="text-xs font-bold">+{trend}</span>
        </div>
      )
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
          <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
          <span className="text-xs font-bold">{trend}</span>
        </div>
      )
    } else {
      return (
        <div className="text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
          <span className="text-xs">-</span>
        </div>
      )
    }
  }

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-white via-teal-50 to-blue-50 relative overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-200/20 via-transparent to-blue-200/20"></div>
      <div className="absolute top-40 right-20 w-64 h-64 bg-teal-200/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-blue-200/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg">
            <Trophy className="mr-2 h-4 w-4" />
            Ranking Elite
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black text-slate-800 mb-6">
            Los Mejores del Pádel
          </h2>
          <p className="text-slate-600 text-xl max-w-3xl mx-auto leading-relaxed">
            Conoce a los jugadores y parejas que están redefiniendo los límites del pádel profesional.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs
            defaultValue="individual"
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
          >
            <TabsList className="w-full border-b border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-white/50 p-2">
              <TabsTrigger
                value="individual"
                className="flex-1 py-4 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300"
              >
                <Trophy className="mr-3 h-5 w-5" />
                <span className="font-semibold">Ranking Individual</span>
              </TabsTrigger>
              <TabsTrigger
                value="pairs"
                className="flex-1 py-4 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl transition-all duration-300"
              >
                <Shield className="mr-3 h-5 w-5" />
                <span className="font-semibold">Ranking de Parejas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual" className="p-0">
              <div className="divide-y divide-slate-100/50">
                {topPlayers.map((player, index) => (
                  <Link
                    key={player.id}
                    href={`/players/${player.id}`}
                    className="block transition-all duration-300"
                    onMouseEnter={() => setHoveredPlayer(player.id)}
                    onMouseLeave={() => setHoveredPlayer(null)}
                  >
                    <div
                      className={`p-6 flex items-center justify-between transition-all duration-300 ${
                        hoveredPlayer === player.id 
                          ? "bg-gradient-to-r from-teal-50/80 to-blue-50/80 backdrop-blur-sm" 
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                    >
                      <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">{getMedalIcon(index)}</div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <img 
                              src={player.avatar} 
                              alt={`${player.firstName} ${player.lastName}`}
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg"
                            />
                            {index < 3 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                                <Star className="h-3 w-3 text-white fill-white" />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className="text-xl font-bold text-slate-800">
                                {player.firstName} {player.lastName}
                              </h3>
                              {index === 0 && (
                                <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Líder
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-600 font-medium">{player.club}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 text-xs">
                                Win Rate: {player.winRate}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge className={`${getCategoryColor(player.category)} shadow-md`}>
                          {player.category}
                        </Badge>
                        
                        <div className="text-center">
                          <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white font-black text-lg rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg">
                            {player.score}
                          </div>
                          <div className="mt-2 flex justify-center">
                            {getTrendIcon(player.trend)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="p-6 bg-gradient-to-r from-slate-50/50 to-white/50 border-t border-slate-100/50 flex justify-center">
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-slate-300 text-slate-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 hover:border-teal-300 hover:text-teal-700 rounded-xl px-6 py-3"
                >
                  <Link href="/ranking" className="flex items-center">
                    <Zap className="mr-2 h-4 w-4" />
                    Ver Ranking Completo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pairs" className="p-0">
              <div className="divide-y divide-slate-100/50">
                {topPairs.map((pair, index) => (
                  <Link
                    key={pair.id}
                    href={`/pairs/${pair.id}`}
                    className="block transition-all duration-300"
                    onMouseEnter={() => setHoveredPlayer(`pair-${pair.id}`)}
                    onMouseLeave={() => setHoveredPlayer(null)}
                  >
                    <div
                      className={`p-6 flex items-center justify-between transition-all duration-300 ${
                        hoveredPlayer === `pair-${pair.id}` 
                          ? "bg-gradient-to-r from-teal-50/80 to-blue-50/80 backdrop-blur-sm" 
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                    >
                      <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">{getMedalIcon(index)}</div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <img 
                              src={pair.player1.avatar} 
                              alt={`${pair.player1.firstName} ${pair.player1.lastName}`}
                              className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md"
                            />
                            <img 
                              src={pair.player2.avatar} 
                              alt={`${pair.player2.firstName} ${pair.player2.lastName}`}
                              className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md -ml-2"
                            />
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-bold text-slate-800">
                                {pair.player1.firstName} {pair.player1.lastName} / {pair.player2.firstName} {pair.player2.lastName}
                              </h3>
                              {index === 0 && (
                                <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Dupla #1
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 text-xs">
                                Win Rate: {pair.winRate}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge className={`${getCategoryColor(pair.category)} shadow-md`}>
                          {pair.category}
                        </Badge>
                        
                        <div className="text-center">
                          <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white font-black text-lg rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg">
                            {pair.score}
                          </div>
                          <div className="mt-2 flex justify-center">
                            {getTrendIcon(pair.trend)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="p-6 bg-gradient-to-r from-slate-50/50 to-white/50 border-t border-slate-100/50 flex justify-center">
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-slate-300 text-slate-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 hover:border-teal-300 hover:text-teal-700 rounded-xl px-6 py-3"
                >
                  <Link href="/ranking?tab=pairs" className="flex items-center">
                    <Zap className="mr-2 h-4 w-4" />
                    Ver Ranking Completo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  )
}
