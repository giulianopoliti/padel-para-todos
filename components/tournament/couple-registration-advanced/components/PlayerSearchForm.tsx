"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, User, UserCheck } from 'lucide-react'

import { PlayerInfo } from '../types'

const searchSchema = z.object({
  searchTerm: z.string().min(3, 'Ingrese al menos 3 caracteres para buscar')
})

interface PlayerSearchFormProps {
  availablePlayers: PlayerInfo[]
  onPlayerSelect: (player: PlayerInfo) => void
  isClubMode: boolean
  userPlayerId?: string | null
  playerNumber: 1 | 2
}

export default function PlayerSearchForm({
  availablePlayers,
  onPlayerSelect,
  isClubMode,
  userPlayerId,
  playerNumber
}: PlayerSearchFormProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<PlayerInfo[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchTerm: ''
    }
  })

  const handleSearch = async (values: z.infer<typeof searchSchema>) => {
    setIsSearching(true)
    setHasSearched(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const searchTermLower = values.searchTerm.toLowerCase()
      const filteredResults = availablePlayers.filter(player => {
        const firstNameMatch = player.first_name?.toLowerCase()?.includes(searchTermLower)
        const lastNameMatch = player.last_name?.toLowerCase()?.includes(searchTermLower)
        const dniMatch = player.dni?.toLowerCase()?.includes(searchTermLower)
        return firstNameMatch || lastNameMatch || dniMatch
      })
      
      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching players:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handlePlayerSelect = (player: PlayerInfo) => {
    onPlayerSelect(player)
    // Reset search
    form.reset()
    setSearchResults([])
    setHasSearched(false)
  }

  // For player mode, show current user option
  const showCurrentUserOption = !isClubMode && userPlayerId && playerNumber === 1

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Busque un jugador existente para la posición {playerNumber}
      </div>

      {/* Current user option for player mode */}
      {showCurrentUserOption && (
        <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-medium text-violet-800">Registrarme a mí mismo</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-violet-300 text-violet-700 hover:bg-violet-100"
            onClick={() => {
              const currentUser = availablePlayers.find(p => p.id === userPlayerId)
              if (currentUser) {
                handlePlayerSelect(currentUser)
              }
            }}
          >
            Seleccionarme como Jugador 1
          </Button>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
          <FormField
            control={form.control}
            name="searchTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buscar jugador</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input placeholder="Nombre, apellido o DNI..." {...field} />
                    <Button type="submit" disabled={isSearching} className="bg-green-600 hover:bg-green-700">
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Resultados de búsqueda ({searchResults.length})
          </h4>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No se encontraron jugadores</p>
              <p className="text-sm">Intente con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="border rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
              {searchResults.map((player) => (
                <div
                  key={player.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handlePlayerSelect(player)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {player.first_name} {player.last_name}
                        </h5>
                        <p className="text-sm text-gray-500">
                          DNI: {player.dni || 'No disponible'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {player.score && (
                        <Badge variant="outline" className="text-xs">
                          Score: {player.score}
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                        Seleccionar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 