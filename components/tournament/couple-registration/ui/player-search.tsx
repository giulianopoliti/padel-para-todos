"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState } from "react"

// Schema for search
const searchFormSchema = z.object({
  searchTerm: z.string().min(3, "Ingrese al menos 3 caracteres para buscar"),
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface PlayerInfo {
  id: string
  first_name: string | null
  last_name: string | null
  score?: number | null
  dni?: string | null
  phone?: string | null
}

interface PlayerSearchProps {
  onSearchResults: (results: PlayerInfo[]) => void
  players: PlayerInfo[]
  label?: string
  placeholder?: string
}

export default function PlayerSearch({ 
  onSearchResults, 
  players, 
  label = "Buscar jugador", 
  placeholder = "Nombre, apellido o DNI" 
}: PlayerSearchProps) {
  const [isSearching, setIsSearching] = useState(false)

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      searchTerm: "",
    },
  })

  const onSearch = async (data: SearchFormValues) => {
    setIsSearching(true)
    try {
      const searchTermLower = data.searchTerm.toLowerCase()
      const filteredResults = players.filter(player => {
        const firstNameMatch = player.first_name?.toLowerCase()?.includes(searchTermLower)
        const lastNameMatch = player.last_name?.toLowerCase()?.includes(searchTermLower)
        const dniMatch = player.dni?.toLowerCase()?.includes(searchTermLower)
        return firstNameMatch || lastNameMatch || dniMatch
      })
      
      onSearchResults(filteredResults)
    } catch (error) {
      console.error("Error al buscar jugadores:", error)
      onSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Form {...searchForm}>
      <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
        <FormField
          control={searchForm.control}
          name="searchTerm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input placeholder={placeholder} {...field} />
                  <Button type="submit" disabled={isSearching} className="bg-teal-600 hover:bg-teal-700">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
} 