import { getRankedPlayers, getCategories } from "@/app/api/users"
import RankingClient from "./ranking-client"
import { redirect } from "next/navigation"

/**
 * Configuración de la página
 * - revalidate: revalidar datos cada hora
 * - dynamic: forzar que la página sea dinámica para manejar parámetros de URL
 */
export const revalidate = 3600
export const dynamic = 'force-dynamic'

/**
 * Página principal del ranking
 * Muestra una lista paginada de jugadores con filtros por categoría y club
 */
export default async function RankingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Si no hay parámetros en la URL, redirigir a la página 1
  if (!searchParams.page) {
    redirect('/ranking?page=1')
  }

  // Parsear los parámetros de búsqueda de manera segura
  const page = typeof searchParams?.page === 'string' 
    ? Math.max(1, parseInt(searchParams.page))
    : 1

  const category = typeof searchParams?.category === 'string' 
    ? searchParams.category 
    : null

  const clubId = typeof searchParams?.clubId === 'string'
    ? searchParams.clubId
    : null

  // Obtener datos iniciales del servidor
  // Usamos Promise.all para ejecutar ambas consultas en paralelo
  const [playersData, categories] = await Promise.all([
    getRankedPlayers({ 
      page,
      category,
      clubId,
      pageSize: 50 // Tamaño fijo de página para consistencia
    }),
    getCategories()
  ])

  // Renderizar el componente cliente con los datos iniciales
  return (
    <RankingClient 
      initialPlayers={playersData.players}
      totalPlayers={playersData.totalCount}
      initialCategories={categories}
      currentPage={playersData.currentPage || page}
      currentCategory={category}
      currentClubId={clubId}
      pageSize={playersData.pageSize || 50}
      totalPages={playersData.totalPages}
      error={playersData.error}
    />
  )
}

