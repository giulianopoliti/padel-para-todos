import type React from "react"

interface TournamentStatusDisplayProps {
  needsMorePairs: boolean
  inscriptionClosed: boolean
  tournamentStarted: boolean
  tournamentFinished: boolean
}

const TournamentStatusDisplay: React.FC<TournamentStatusDisplayProps> = ({
  needsMorePairs,
  inscriptionClosed,
  tournamentStarted,
  tournamentFinished,
}) => {
  if (tournamentFinished) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Torneo Finalizado</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>El torneo ha finalizado. Consulta los resultados.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (tournamentStarted) {
    return (
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Torneo En Curso</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>El torneo ha comenzado. ¡Sigue los partidos!</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (inscriptionClosed) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Inscripción Cerrada</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Las inscripciones para este torneo están cerradas.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (needsMorePairs) {
    return (
      <div className="rounded-md bg-amber-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.529 0-2.492-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-amber-700">Se necesitan más parejas</h3>
            <div className="mt-2 text-sm text-amber-600">
              <p>Estamos buscando más parejas para completar el torneo.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default TournamentStatusDisplay
