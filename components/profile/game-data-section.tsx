import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy } from "lucide-react"

interface GameDataSectionProps {
  defaultValues: any
  allClubs: any[]
}

export function GameDataSection({ defaultValues, allClubs }: GameDataSectionProps) {
  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Trophy className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Datos de Juego</CardTitle>
            <p className="text-sm text-gray-600">Información sobre tu juego y preferencias</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="club_id" className="text-sm font-medium text-gray-700">
            Club
          </Label>
          <Select name="club_id" defaultValue={defaultValues.club_id}>
            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Selecciona un club" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="NO_CLUB" className="text-gray-700 hover:bg-blue-50">
                Sin club
              </SelectItem>
              {allClubs.map((club) => (
                <SelectItem key={club.id} value={club.id} className="text-gray-700 hover:bg-blue-50">
                  {club.name || "Club sin nombre"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Lado Preferido</Label>
          <RadioGroup
            name="preferred_side"
            defaultValue={defaultValues.preferred_side}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <RadioGroupItem value="DRIVE" id="side-drive" className="text-blue-600 border-gray-300" />
              <Label htmlFor="side-drive" className="text-gray-700">
                Drive
              </Label>
            </div>
            <div className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <RadioGroupItem value="REVES" id="side-reves" className="text-blue-600 border-gray-300" />
              <Label htmlFor="side-reves" className="text-gray-700">
                Revés
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="racket" className="text-sm font-medium text-gray-700">
            Paleta
          </Label>
          <Input
            id="racket"
            name="racket"
            defaultValue={defaultValues.racket}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category_name" className="text-sm font-medium text-gray-700">
              Categoría
            </Label>
            <Input
              id="category_name"
              name="category_name"
              defaultValue={defaultValues.category_name}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="score" className="text-sm font-medium text-gray-700">
              Puntaje
            </Label>
            <Input
              id="score"
              name="score"
              type="number"
              step="0.01"
              defaultValue={defaultValues.score}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
