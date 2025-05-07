"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Clock, CheckCircle, Calendar } from "lucide-react"

export default function CoachView() {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-light text-teal-700 mb-6">Panel de Entrenador</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-teal-600" />
              Torneos de Alumnos
            </CardTitle>
            <CardDescription>Torneos donde participan tus alumnos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light text-slate-700">5</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-teal-600" />
              Próximas Clases
            </CardTitle>
            <CardDescription>Clases programadas esta semana</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light text-slate-700">12</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-100 hover:border-teal-100 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-teal-700 flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-teal-600" />
              Alumnos Activos
            </CardTitle>
            <CardDescription>Total de alumnos actualmente</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-light text-slate-700">18</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="upcoming" className="bg-white rounded-lg shadow-sm border border-slate-100 hover:border-teal-100 transition-all duration-300">
        <TabsList className="w-full border-b border-slate-200 rounded-t-lg bg-slate-50">
          <TabsTrigger
            value="upcoming"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Próximas Clases
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="flex-1 py-3 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-teal-500"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Torneos de Alumnos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="p-6">
          <p className="text-center text-slate-500">
            Aquí se mostrarán tus próximas clases programadas.
          </p>
        </TabsContent>

        <TabsContent value="students" className="p-6">
          <p className="text-center text-slate-500">
            Aquí podrás ver los torneos donde participan tus alumnos.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
} 