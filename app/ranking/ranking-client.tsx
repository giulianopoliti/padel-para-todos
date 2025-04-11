"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Navbar from "@/components/navbar"
import type { Player, Category } from "@/types"
import { Trophy, Medal, Search, Filter, Users } from "lucide-react"

interface RankingClientProps {
  initialPlayers: Player[]
  initialCategories: Category[]
}

export default function RankingClient({ initialPlayers, initialCategories }: RankingClientProps) {
  const [players] = useState<Player[]>(initialPlayers)
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>(initialPlayers)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  console.log("players", players);
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    applyFilters(term, categoryFilter)
  }

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category)
    applyFilters(searchTerm, category)
  }

  const applyFilters = (term: string, category: string) => {
    let filtered = players

    if (term) {
      filtered = filtered.filter((player) =>
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(term.toLowerCase()),
      )
    }

    if (category !== "all") {
      filtered = filtered.filter((player) => player.category === category)
    }

    setFilteredPlayers(filtered)
  }

  const getCategoryName = (categoryId: string) => {
    const category = initialCategories.find((c) => c.id === categoryId)
    return category ? category.name : categoryId
  }

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-500" // Gold
      case 1:
        return "text-gray-400" // Silver
      case 2:
        return "text-amber-700" // Bronze
      default:
        return "text-gray-300" // Other positions
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-padel-green-700 mb-2">Ranking de Jugadores</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Consulta el ranking actualizado de todos los jugadores por categoría y encuentra tu posición.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar jugadores..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-padel-green-200 focus:border-padel-green-500 focus:ring-padel-green-500"
              />
            </div>
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="pl-10 border-padel-green-200 focus:border-padel-green-500 focus:ring-padel-green-500">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {initialCategories.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="individual" className="bg-white rounded-lg shadow-md">
          <TabsList className="w-full border-b border-gray-200 rounded-t-lg bg-padel-green-50">
            <TabsTrigger
              value="individual"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Ranking Individual
            </TabsTrigger>
            <TabsTrigger
              value="pairs"
              className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-padel-green-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-padel-green-600"
            >
              <Users className="mr-2 h-4 w-4" />
              Ranking de Parejas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="p-0">
            <div className="rounded-b-md overflow-hidden">
              <Table>
                <TableHeader className="bg-padel-green-50">
                  <TableRow>
                    <TableHead className="w-16 text-center font-semibold">Pos.</TableHead>
                    <TableHead className="font-semibold">Jugador</TableHead>
                    <TableHead className="font-semibold">Categoría</TableHead>
                    <TableHead className="text-right font-semibold">Puntos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player, index) => (
                      <TableRow key={player.id} className="hover:bg-padel-green-50">
                        <TableCell className="text-center font-medium">
                          {index < 3 ? <Medal className={`inline ${getMedalColor(index)}`} size={18} /> : index + 1}
                        </TableCell>
                        <TableCell className="text-left font-bold text-padel-green-700">
                          {player.firstName} {player.lastName}
                        </TableCell>
                        <TableCell className="text-left font-bold text-padel-green-700">{getCategoryName(player.category)}</TableCell>
                        <TableCell className="text-right font-bold text-padel-green-700">{player.score}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                        No se encontraron jugadores con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="pairs">
            <div className="p-6 text-center">
              <div className="py-12 px-4">
                <Trophy className="h-12 w-12 text-padel-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-padel-green-700 mb-2">Próximamente</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  El ranking de parejas estará disponible próximamente. ¡Mantente atento a las actualizaciones!
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 