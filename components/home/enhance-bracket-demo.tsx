"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Trophy, Users, Target, Clock } from "lucide-react"

export default function EnhancedBracketDemo() {
  const [currentView, setCurrentView] = useState<"zones" | "bracket">("zones")
  const [animationStep, setAnimationStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mock data para las zonas
  const zones = [
    {
      id: "zone-a",
      name: "Zona A",
      couples: [
        {
          id: "1",
          player1_name: "Micael Politi",
          player2_name: "Giuliano Politi",
          stats: { played: 2, won: 2, lost: 0, scored: 0, conceded: 0, points: 6 },
        },
        {
          id: "2",
          player1_name: "Martin Rodriguez",
          player2_name: "Alejandro Sanchez",
          stats: { played: 2, won: 1, lost: 1, scored: 0, conceded: 0, points: 3 },
        },
        {
          id: "3",
          player1_name: "Pablo Molina",
          player2_name: "Pack Pilot",
          stats: { played: 2, won: 0, lost: 2, scored: 0, conceded: 0, points: 0 },
        },
      ],
    },
    {
      id: "zone-b",
      name: "Zona B",
      couples: [
        {
          id: "4",
          player1_name: "Jose Politi",
          player2_name: "Isabella Politi",
          stats: { played: 2, won: 2, lost: 0, scored: 0, conceded: 0, points: 6 },
        },
        {
          id: "5",
          player1_name: "Julian Valdez",
          player2_name: "Ezequiel Martinez",
          stats: { played: 2, won: 1, lost: 1, scored: 0, conceded: 0, points: 3 },
        },
        {
          id: "6",
          player1_name: "Federico Lopez",
          player2_name: "Luciano Fernandez",
          stats: { played: 2, won: 0, lost: 2, scored: 0, conceded: 0, points: 0 },
        },
      ],
    },
    {
      id: "zone-c",
      name: "Zona C",
      couples: [
        {
          id: "7",
          player1_name: "Sebastian Torres",
          player2_name: "Juan Acosta",
          stats: { played: 2, won: 2, lost: 0, scored: 0, conceded: 0, points: 6 },
        },
        {
          id: "8",
          player1_name: "Tomas Rojas",
          player2_name: "Silvano Hernandez",
          stats: { played: 2, won: 1, lost: 1, scored: 0, conceded: 0, points: 3 },
        },
        {
          id: "9",
          player1_name: "Juan Acosta",
          player2_name: "Matias Gonzalez",
          stats: { played: 2, won: 0, lost: 2, scored: 0, conceded: 0, points: 0 },
        },
      ],
    },
  ]

  // Mock data para el bracket
  const bracketMatches = [
    // Cuartos de final
    {
      id: 1,
      round: "Cuartos",
      team1: "Miguel / Guillermo",
      team2: "Isa / Isabella",
      score1: 6,
      score2: 3,
      status: "completed",
      position: { x: 0, y: 0 },
    },
    {
      id: 2,
      round: "Cuartos",
      team1: "Jose / Isabella",
      team2: "Sebastian / Torres",
      score1: 4,
      score2: 6,
      status: "completed",
      position: { x: 0, y: 1 },
    },
    {
      id: 3,
      round: "Cuartos",
      team1: "Julian / Valdez",
      team2: "Federico / Lopez",
      score1: 6,
      score2: 2,
      status: "completed",
      position: { x: 0, y: 2 },
    },
    {
      id: 4,
      round: "Cuartos",
      team1: "Tomas / Rojas",
      team2: "Juan / Acosta",
      score1: 3,
      score2: 6,
      status: "completed",
      position: { x: 0, y: 3 },
    },
    // Semifinales
    {
      id: 5,
      round: "Semifinal",
      team1: "Miguel / Guillermo",
      team2: "Sebastian / Torres",
      score1: 6,
      score2: 4,
      status: "completed",
      position: { x: 1, y: 0 },
    },
    {
      id: 6,
      round: "Semifinal",
      team1: "Julian / Valdez",
      team2: "Juan / Acosta",
      score1: 7,
      score2: 5,
      status: "completed",
      position: { x: 1, y: 1 },
    },
    // Final
    {
      id: 7,
      round: "Final",
      team1: "Miguel / Guillermo",
      team2: "Julian / Valdez",
      score1: null,
      score2: null,
      status: "pending",
      position: { x: 2, y: 0 },
    },
  ]

  // Función para dibujar las líneas de conexión entre partidos
  const drawBracketLines = (step: number) => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) return

    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const matchElements = container.querySelectorAll(".bracket-match")
    const positions: { id: number; rect: DOMRect }[] = []

    matchElements.forEach((el) => {
      const id = Number.parseInt(el.getAttribute("data-match-id") || "0")
      positions.push({
        id,
        rect: el.getBoundingClientRect(),
      })
    })

    const containerRect = container.getBoundingClientRect()
    positions.forEach((pos) => {
      pos.rect = new DOMRect(
        pos.rect.x - containerRect.x,
        pos.rect.y - containerRect.y,
        pos.rect.width,
        pos.rect.height,
      )
    })

    const connections = [
      { from: 1, to: 5 },
      { from: 2, to: 5 },
      { from: 3, to: 6 },
      { from: 4, to: 6 },
      { from: 5, to: 7 },
      { from: 6, to: 7 },
    ]

    ctx.lineWidth = 2
    ctx.strokeStyle = "#7b9dcf"

    let maxConnections = 0
    if (step >= 1) maxConnections = 4
    if (step >= 2) maxConnections = 6

    connections.slice(0, maxConnections).forEach((conn) => {
      const fromMatch = positions.find((p) => p.id === conn.from)
      const toMatch = positions.find((p) => p.id === conn.to)

      if (fromMatch && toMatch) {
        const startX = fromMatch.rect.x + fromMatch.rect.width
        const startY = fromMatch.rect.y + fromMatch.rect.height / 2
        const endX = toMatch.rect.x
        const endY = toMatch.rect.y + toMatch.rect.height / 2

        const midX = startX + (endX - startX) / 2

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(midX, startY)
        ctx.lineTo(midX, endY)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        ctx.fillStyle = "#7b9dcf"
        ctx.beginPath()
        ctx.arc(midX, endY, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }

  useEffect(() => {
    if (currentView === "bracket") {
      setAnimationStep(0)
      setIsAnimating(true)

      const timer = setInterval(() => {
        setAnimationStep((prev) => {
          const next = prev + 1
          if (next > 2) {
            clearInterval(timer)
            setIsAnimating(false)
            return 2
          }
          return next
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [currentView])

  useEffect(() => {
    if (currentView === "bracket") {
      drawBracketLines(animationStep)

      const handleResize = () => drawBracketLines(animationStep)
      window.addEventListener("resize", handleResize)

      return () => window.removeEventListener("resize", handleResize)
    }
  }, [animationStep, currentView])

  const switchView = (view: "zones" | "bracket") => {
    setCurrentView(view)
  }

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Gestión de Torneos en Tiempo Real</h2>
          <p className="text-gray-600">
            Explora nuestro sistema avanzado de gestión de torneos con zonas clasificatorias y brackets eliminatorios.
          </p>
        </div>

        {/* Control de navegación */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200 flex">
            <Button
              onClick={() => switchView("zones")}
              variant={currentView === "zones" ? "default" : "ghost"}
              className={`px-6 py-3 transition-all duration-300 ${
                currentView === "zones" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Users className="mr-2 h-5 w-5" />
              Zonas Clasificatorias
            </Button>
            <Button
              onClick={() => switchView("bracket")}
              variant={currentView === "bracket" ? "default" : "ghost"}
              className={`px-6 py-3 transition-all duration-300 ${
                currentView === "bracket" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Target className="mr-2 h-5 w-5" />
              Bracket Eliminatorio
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Vista de Zonas */}
          {currentView === "zones" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {zones.map((zone, index) => (
                <Card
                  key={zone.id}
                  className={`overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-md ${
                    index === 0
                      ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
                      : index === 1
                        ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
                        : "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
                  }`}
                >
                  <CardHeader className="py-4 bg-blue-600">
                    <CardTitle className="text-xl font-bold text-white flex items-center justify-center">
                      <Trophy className="mr-2 h-5 w-5" />
                      {zone.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-700 text-sm">Pareja</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center text-sm">PJ</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center text-sm">PG</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center text-sm">PP</TableHead>
                          <TableHead className="font-semibold text-gray-700 text-center text-sm">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {zone.couples.map((couple, coupleIndex) => (
                          <TableRow
                            key={couple.id}
                            className={`hover:bg-gray-50 transition-colors ${
                              coupleIndex === 0 ? "bg-gradient-to-r from-blue-50/50 to-transparent" : ""
                            }`}
                          >
                            <TableCell className="font-medium text-gray-800 py-3">
                              <div className="flex items-center">
                                {coupleIndex === 0 && <Trophy className="mr-2 h-4 w-4 text-blue-500" />}
                                <div>
                                  <div className="text-sm font-semibold">{couple.player1_name}</div>
                                  <div className="text-sm text-gray-600">{couple.player2_name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-gray-600">{couple.stats.played}</TableCell>
                            <TableCell className="text-center text-blue-600 font-semibold">
                              {couple.stats.won}
                            </TableCell>
                            <TableCell className="text-center text-gray-600 font-semibold">
                              {couple.stats.lost}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-flex items-center justify-center font-bold rounded-full h-8 w-8 text-sm bg-blue-100 text-blue-700">
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
          {currentView === "bracket" && (
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Bracket Eliminatorio</h3>
                <p className="text-gray-600">Sigue el progreso del torneo en tiempo real</p>
                {isAnimating && (
                  <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200">
                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                    Generando bracket...
                  </Badge>
                )}
              </div>

              <div className="flex justify-center">
                <div
                  ref={containerRef}
                  className="grid grid-cols-3 gap-8 items-center relative"
                  style={{ minHeight: "500px" }}
                >
                  <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

                  {/* Cuartos de Final */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-center text-gray-700 mb-4">Cuartos de Final</h4>
                    {bracketMatches
                      .filter((m) => m.round === "Cuartos")
                      .map((match, idx) => (
                        <div
                          key={match.id}
                          data-match-id={match.id}
                          className={`bracket-match bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-all duration-500 ${
                            animationStep >= 0 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                          }`}
                          style={{ transitionDelay: `${idx * 200}ms` }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-800">{match.team1}</span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {match.score1}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-800">{match.team2}</span>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              {match.score2}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Semifinales */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-center text-gray-700 mb-4">Semifinales</h4>
                    {bracketMatches
                      .filter((m) => m.round === "Semifinal")
                      .map((match, idx) => (
                        <div
                          key={match.id}
                          data-match-id={match.id}
                          className={`bracket-match bg-white p-4 rounded-lg border border-blue-200 shadow-sm transition-all duration-500 ${
                            animationStep >= 1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                          }`}
                          style={{ transitionDelay: `${idx * 200 + 400}ms`, marginTop: idx === 0 ? "40px" : "120px" }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-800">{match.team1}</span>
                            <Badge className="bg-blue-100 text-blue-700">{match.score1}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-800">{match.team2}</span>
                            <Badge className="bg-gray-100 text-gray-700">{match.score2}</Badge>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Final */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-center text-gray-700 mb-4">Final</h4>
                    {bracketMatches
                      .filter((m) => m.round === "Final")
                      .map((match, idx) => (
                        <div
                          key={match.id}
                          data-match-id={match.id}
                          className={`bracket-match bg-white p-4 rounded-lg border border-blue-200 shadow-sm transition-all duration-500 ${
                            animationStep >= 2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
                          }`}
                          style={{ transitionDelay: `${idx * 200 + 800}ms`, marginTop: "80px" }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-800">{match.team1}</span>
                            <Badge variant="outline" className="bg-gray-50 text-gray-600">
                              vs
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-800">{match.team2}</span>
                            <Badge className="bg-blue-100 text-blue-700">
                              <Trophy className="h-3 w-3 mr-1" />
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
            onClick={() => switchView(currentView === "zones" ? "bracket" : "zones")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            {currentView === "zones" ? (
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
