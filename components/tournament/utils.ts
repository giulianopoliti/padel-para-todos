import type { AmericanMatch, LargeMatch } from "@/types"

/**
 * Formatea una fecha a formato localizado español
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-AR", { 
    day: "numeric", 
    month: "long", 
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires"
  })
}

/**
 * Formatea el resultado de un partido
 */
export const formatMatchScore = (match: AmericanMatch | LargeMatch): string => {
  if (match.status !== "FINISHED") return "-"
  return `${match.result_couple_1} - ${match.result_couple_2}`
} 