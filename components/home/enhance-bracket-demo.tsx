"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Trophy, Users, Target, Zap } from "lucide-react"

export default function EnhancedBracketDemo() {
  const [currentView, setCurrentView] = useState<'zones' | 'bracket'>('zones')

  // Mock data para las zonas
  const zones = [
    {
      id: "zone-a",
      name: "Zona A",
      couples: [
        { id: "1", player1_name: "Micael Politi", player2_name: "Giuliano Politi", stats: { played: 2, won: 0, lost: 0, scored: 0, conceded: 0, points: 6 } },
        { id: "2", player1_name: "Martin Rodriguez", player2_name: "Alejandro Sanchez", stats: { played: 1, won: 1, lost: 0, scored: 0, conceded: 0, points: 4 } },
        { id: "3", player1_name: "Pablo Molina", player2_name: "Pack Pilot", stats: { played: 0, won: 2, lost: 0, scored: 0, conceded: 0, points: 2 } }
      ]
    },
    {
      id: "zone-b", 
      name: "Zona B",
      couples: [
        { id: "4", player1_name: "Jose Politi", player2_name: "Isabella Politi", stats: { played: 2, won: 0, lost: 0, scored: 0, conceded: 0, points: 6 } },
        { id: "5", player1_name: "Julian Valdez", player2_name: "Ezequiel Martinez", stats: { played: 1, won: 1, lost: 0, scored: 0, conceded: 0, points: 4 } },
        { id: "6", player1_name: "Federico Lopez", player2_name: "Luciano Fernandez", stats: { played: 0, won: 2, lost: 0, scored: 0, conceded: 0, points: 2 } }
      ]
    },
    {
      id: "zone-c",
      name: "Zona C", 
      couples: [
        { id: "7", player1_name: "Sebastian Torres", player2_name: "Juan Acosta", stats: { played: 2, won: 0, lost: 0, scored: 0, conceded: 0, points: 6 } },
        { id: "8", player1_name: "Tomas Rojas", player2_name: "Silvano Hernandez", stats: { played: 1, won: 1, lost: 0, scored: 0, conceded: 0, points: 4 } },
        { id: "9", player1_name: "Juan Acosta", player2_name: "Matias Gonzalez", stats: { played: 0, won: 2, lost: 0, scored: 0, conceded: 0, points: 2 } }
      ]
    }
  ]

  // Mock data para el bracket
  const bracketMatches = [
    { id: 1, round: "8vos", team1: "Miguel / Guillermo", team2: "Isa / Isabella", score1: 6, score2: 3, status: "completed" },
    { id: 2, round: "8vos", team1: "Jose / Isabella", team2: "Sebastian / Torres", score1: 4, score2: 6, status: "completed" },
    { id: 3, round: "4tos", team1: "Miguel / Guillermo", team2: "Sebastian / Torres", score1: 6, score2: 4, status: "completed" },
    { id: 4, round: "Semi", team1: "Miguel / Guillermo", team2: "Julian / Valdez", score1: null, score2: null, status: "pending" }
  ]

  const switchView = (view: 'zones' | 'bracket') => {
    setCurrentView(view)
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-slate-100 via-white to-teal-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-200/30 via-transparent to-blue-200/30"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white">
            <Trophy className="mr-2 h-4 w-4" />
            Demo Interactivo
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6">
            Gestión de Torneos en Tiempo Real
          </h2>
          <p className="text-slate-600 text-xl max-w-3xl mx-auto leading-relaxed">
            Explora nuestro sistema avanzado de gestión de torneos con zonas clasificatorias y brackets eliminatorios.
          </p>
        </div>

        {/* Control de navegación */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-slate-200 flex">
            <Button
              onClick={() => switchView('zones')}
              variant={currentView === 'zones' ? 'default' : 'ghost'}
              className={`rounded-xl px-6 py-3 transition-all duration-300 ${
                currentView === 'zones' 
                  ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users className="mr-2 h-5 w-5" />
              Zonas Clasificatorias
            </Button>
            <Button
              onClick={() => switchView('bracket')}
              variant={currentView === 'bracket' ? 'default' : 'ghost'}
              className={`rounded-xl px-6 py-3 transition-all duration-300 ${
                currentView === 'bracket' 
                  ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Target className="mr-2 h-5 w-5" />
              Bracket Eliminatorio
            </Button>
          </div>
        </div>

        {/* Contenedor principal centrado */}
        <div className="max-w-6xl mx-auto">
          {/* Vista de Zonas */}
          {currentView === 'zones' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {zones.map((zone, index) => (
                <Card key={zone.id} className={`overflow-hidden border-2 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  index === 0 ? 'border-teal-200 bg-gradient-to-br from-teal-50 to-white' :
                  index === 1 ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' :
                  'border-purple-200 bg-gradient-to-br from-purple-50 to-white'
                }`}>
                  <CardHeader className={`py-4 ${
                    index === 0 ? 'bg-gradient-to-r from-teal-500 to-teal-600' :
                    index === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}>
                    <CardTitle className="text-xl font-bold text-white flex items-center justify-center">
                      <Trophy className="mr-2 h-5 w-5" />
                      {zone.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="font-semibold text-slate-700 text-sm">Pareja</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center text-sm">PJ</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center text-sm">PG</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center text-sm">PP</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center text-sm">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {zone.couples.map((couple, coupleIndex) => (
                          <TableRow key={couple.id} className={`hover:bg-slate-50/70 transition-colors ${
                            coupleIndex === 0 ? 'bg-gradient-to-r from-amber-50/50 to-transparent' : ''
                          }`}>
                            <TableCell className="font-medium text-slate-800 py-3">
                              <div className="flex items-center">
                                {coupleIndex === 0 && <Trophy className="mr-2 h-4 w-4 text-amber-500" />}
                                <div>
                                  <div className="text-sm font-semibold">{couple.player1_name}</div>
                                  <div className="text-sm text-slate-600">{couple.player2_name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-slate-600">{couple.stats.played}</TableCell>
                            <TableCell className="text-center text-emerald-600 font-semibold">{couple.stats.won}</TableCell>
                            <TableCell className="text-center text-rose-600 font-semibold">{couple.stats.lost}</TableCell>
                            <TableCell className="text-center">
                              <div className={`inline-flex items-center justify-center font-bold rounded-full h-8 w-8 text-sm ${
                                index === 0 ? 'bg-teal-100 text-teal-700' :
                                index === 1 ? 'bg-blue-100 text-blue-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {couple.stats.points}
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
          )}

          {/* Vista del Bracket */}
          {currentView === 'bracket' && (
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 animate-fade-in">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-slate-800 mb-2">Bracket Eliminatorio</h3>
                <p className="text-slate-600">Sigue el progreso del torneo en tiempo real</p>
              </div>
              
              <div className="flex justify-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-4xl">
                  {/* 8vos */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-center text-slate-700 mb-4">8vos de Final</h4>
                    {bracketMatches.filter(m => m.round === '8vos').map(match => (
                      <div key={match.id} className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-slate-800">{match.team1}</span>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {match.score1}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-800">{match.team2}</span>
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                            {match.score2}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 4tos */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-center text-slate-700 mb-4">4tos de Final</h4>
                    {bracketMatches.filter(m => m.round === '4tos').map(match => (
                      <div key={match.id} className="bg-gradient-to-r from-teal-50 to-white p-4 rounded-xl border border-teal-200 shadow-md">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-slate-800">{match.team1}</span>
                          <Badge className="bg-emerald-100 text-emerald-700">
                            {match.score1}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-800">{match.team2}</span>
                          <Badge className="bg-rose-100 text-rose-700">
                            {match.score2}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Semifinal */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-center text-slate-700 mb-4">Semifinal</h4>
                    {bracketMatches.filter(m => m.round === 'Semi').map(match => (
                      <div key={match.id} className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-xl border border-blue-200 shadow-md">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-slate-800">{match.team1}</span>
                          <Badge variant="outline" className="bg-slate-100 text-slate-600">
                            vs
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-800">{match.team2}</span>
                          <Badge className="bg-amber-100 text-amber-700">
                            <Zap className="h-3 w-3 mr-1" />
                            Próximo
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navegación entre vistas */}
        <div className="flex justify-center mt-8 space-x-4">
          <Button
            onClick={() => switchView(currentView === 'zones' ? 'bracket' : 'zones')}
            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-xl px-6 py-3 shadow-lg"
          >
            {currentView === 'zones' ? (
              <>
                Ver Bracket
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                <ChevronLeft className="mr-2 h-5 w-5" />
                Ver Zonas
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  )
}
