/**
 * Utility functions for generating tournament elimination brackets
 * Implements proper seeding algorithm for padel tournaments
 */

import type { CoupleInfo, MatchInfo } from "@/components/tournament/club/types"
import { Couple, Zone, Round } from "@/types"

// =============================================================================
// TIPOS PRINCIPALES
// =============================================================================

/**
 * Pareja clasificada con toda la información necesaria para el seeding
 */
export interface CoupleSeeded {
  id: string
  zona: string  // 'A', 'B', 'C', etc.
  puntos: number
  posicionEnZona: number  // 1 para primeros, 2 para segundos, etc.
  player1_id?: string
  player2_id?: string
  player1_name?: string
  player2_name?: string
  zone_id?: string
  [key: string]: any  // Propiedades adicionales
}

/**
 * Pareja con seed global asignado
 */
export interface CoupleWithSeed extends CoupleSeeded {
  seed: number  // Seed global (1, 2, 3, ...)
}

/**
 * Match del bracket eliminatorio
 */
export interface BracketMatch {
  id: string
  round: Round
  order: number
  pareja1: CoupleWithSeed | null
  pareja2: CoupleWithSeed | null
  status: 'PENDING' | 'FINISHED'
  winner_id?: string | null
  couple1_id?: string | null
  couple2_id?: string | null
}

/**
 * Configuración del bracket
 */
export interface BracketConfig {
  tournamentId: string
  totalCouples: number
  bracketSize: number
  initialRound: Round
  numByes: number
}

// =============================================================================
// ALGORITMO PRINCIPAL DE SEEDING
// =============================================================================

/**
 * Función principal que implementa el algoritmo de seeding completo
 * 
 * @param couples Array de parejas clasificadas con zona, puntos y posición
 * @returns Array de matches del bracket eliminatorio
 */
export function generateEliminationBracket(couples: CoupleSeeded[]): BracketMatch[] {
  if (couples.length === 0) {
    return []
  }

  // Paso 1: Asignar seeds globales
  const seededCouples = assignGlobalSeeds(couples)
  
  // Paso 2: Configurar el bracket
  const config = createBracketConfig(seededCouples.length)
  
  // Paso 3: Generar los matches
  const matches = createBracketMatches(seededCouples, config)
  
  return matches
}

/**
 * Asigna seeds globales siguiendo la regla:
 * 1. Los ganadores de zona obtienen seeds 1, 2, 3, etc. según el orden de creación de la zona
 * 2. Luego todos los segundos de zona en el mismo orden
 * 3. Luego todos los terceros, etc.
 * 4. TODOS los participantes avanzan al bracket eliminatorio
 */
export function assignGlobalSeeds(couples: CoupleSeeded[]): CoupleWithSeed[] {
  // Primero, obtener el orden único de las zonas basado en el orden en que aparecen
  // Asumimos que las parejas vienen ordenadas por zona según el orden de creación
  const zoneOrder: string[] = []
  const zoneMap = new Map<string, number>()
  
  // Construir el orden de las zonas basado en primera aparición
  couples.forEach(couple => {
    if (!zoneMap.has(couple.zona)) {
      zoneMap.set(couple.zona, zoneOrder.length)
      zoneOrder.push(couple.zona)
    }
  })
  
  console.log('[assignGlobalSeeds] Orden de zonas detectado:', zoneOrder)
  
  // Agrupar por posición en zona
  const couplesGroupedByPosition: { [position: number]: CoupleSeeded[] } = {}
  
  couples.forEach(couple => {
    const position = couple.posicionEnZona
    if (!couplesGroupedByPosition[position]) {
      couplesGroupedByPosition[position] = []
    }
    couplesGroupedByPosition[position].push(couple)
  })

  // Asignar seeds
  const seededCouples: CoupleWithSeed[] = []
  let currentSeed = 1

  // Procesar en orden de posición (1ros, 2dos, 3ros, etc.)
  const positions = Object.keys(couplesGroupedByPosition)
    .map(Number)
    .sort((a, b) => a - b)

  positions.forEach(position => {
    const couplesInPosition = couplesGroupedByPosition[position]
    
    // Para los primeros lugares, asignar seeds según el número de zona
    if (position === 1) {
      // Los ganadores de zona obtienen seeds 1, 2, 3, etc.
      // según el orden de las zonas (no alfabético)
      const sortedByZoneOrder = couplesInPosition.sort((a, b) => {
        const zoneIndexA = zoneMap.get(a.zona) ?? 999
        const zoneIndexB = zoneMap.get(b.zona) ?? 999
        return zoneIndexA - zoneIndexB
      })
      
      sortedByZoneOrder.forEach((couple, index) => {
        seededCouples.push({
          ...couple,
          seed: index + 1 // Seeds 1, 2, 3, etc. para ganadores
        })
        console.log(`[assignGlobalSeeds] Seed ${index + 1}: ${couple.zona} (1° lugar) - ${couple.puntos} pts`)
      })
      
      currentSeed = sortedByZoneOrder.length + 1
    } else {
      // Para las demás posiciones, mantener el orden por zona
      // pero continuar con la numeración secuencial
      const sortedByZoneOrder = couplesInPosition.sort((a, b) => {
        const zoneIndexA = zoneMap.get(a.zona) ?? 999
        const zoneIndexB = zoneMap.get(b.zona) ?? 999
        if (zoneIndexA !== zoneIndexB) {
          return zoneIndexA - zoneIndexB
        }
        // Si misma zona (no debería pasar), ordenar por puntos descendente
        return b.puntos - a.puntos
      })
      
      sortedByZoneOrder.forEach(couple => {
        seededCouples.push({
          ...couple,
          seed: currentSeed++
        })
        console.log(`[assignGlobalSeeds] Seed ${currentSeed - 1}: ${couple.zona} (${couple.posicionEnZona}° lugar) - ${couple.puntos} pts`)
      })
    }
  })

  console.log(`[assignGlobalSeeds] Total parejas sembradas: ${seededCouples.length}`)
  return seededCouples
}

/**
 * Crea la configuración del bracket basada en el número de parejas
 */
export function createBracketConfig(totalCouples: number, tournamentId: string = ''): BracketConfig {
  // Calcular el tamaño del bracket (próxima potencia de 2)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(2, totalCouples))))
  const numByes = bracketSize - totalCouples
  const initialRound = getRoundName(bracketSize)

  return {
    tournamentId,
    totalCouples,
    bracketSize,
    initialRound,
    numByes
  }
}

/**
 * Crea los matches del bracket usando el algoritmo de seeding tradicional
 * Implementa: seed 1 vs seed N, seed 2 vs seed N-1, etc.
 */
export function createBracketMatches(
  seededCouples: CoupleWithSeed[], 
  config: BracketConfig
): BracketMatch[] {
  const matches: BracketMatch[] = []
  const { bracketSize, initialRound, numByes } = config

  // Crear array de participantes incluyendo BYEs
  const participants: (CoupleWithSeed | null)[] = new Array(bracketSize).fill(null)
  
  // Colocar parejas reales en las posiciones correctas
  seededCouples.forEach((couple, index) => {
    if (index < bracketSize) {
      participants[index] = couple
    }
  })

  // Obtener índices de emparejamiento según el patrón tradicional
  const pairingIndices = getBracketPairingIndices(bracketSize)
  
  // Crear matches para la primera ronda
  for (let i = 0; i < pairingIndices.length; i += 2) {
    const index1 = pairingIndices[i]
    const index2 = pairingIndices[i + 1]
    
    const pareja1 = participants[index1]
    const pareja2 = participants[index2]
    
    // Determinar el estado del match
    let status: 'PENDING' | 'FINISHED' = 'PENDING'
    let winner_id: string | null = null
    
    // Si una pareja es null (BYE), la otra avanza automáticamente
    if (pareja1 === null && pareja2 !== null) {
      status = 'FINISHED'
      winner_id = pareja2.id
    } else if (pareja1 !== null && pareja2 === null) {
      status = 'FINISHED'
      winner_id = pareja1.id
    }

    matches.push({
      id: `bracket-match-${Math.floor(i / 2) + 1}`,
      round: initialRound,
      order: Math.floor(i / 2) + 1,
      pareja1,
      pareja2,
      status,
      winner_id,
      couple1_id: pareja1?.id || null,
      couple2_id: pareja2?.id || null
    })
  }

  return matches
}

/**
 * Obtiene los índices de emparejamiento para un bracket de tamaño dado
 * Implementa el patrón tradicional: mejor vs peor, segundo mejor vs segundo peor, etc.
 */
export function getBracketPairingIndices(bracketSize: number): number[] {
  const indices: number[] = []
  
  // Patrones predefinidos para tamaños comunes
  const pairingPatterns: { [size: number]: number[] } = {
    2: [0, 1],
    4: [0, 3, 1, 2],
    8: [0, 7, 3, 4, 1, 6, 2, 5],
    16: [0, 15, 7, 8, 3, 12, 4, 11, 1, 14, 6, 9, 2, 13, 5, 10],
    32: [0, 31, 15, 16, 7, 24, 8, 23, 3, 28, 12, 19, 4, 27, 11, 20, 1, 30, 14, 17, 6, 25, 9, 22, 2, 29, 13, 18, 5, 26, 10, 21]
  }

  if (pairingPatterns[bracketSize]) {
    return pairingPatterns[bracketSize]
  }

  // Patrón genérico para tamaños no predefinidos
  for (let i = 0; i < bracketSize / 2; i++) {
    indices.push(i, bracketSize - 1 - i)
  }

  return indices
}

/**
 * Obtiene el nombre de la ronda basado en el tamaño del bracket
 */
export function getRoundName(bracketSize: number): Round {
  const roundMap: { [size: number]: Round } = {
    2: "FINAL",
    4: "SEMIFINAL", 
    8: "4TOS",
    16: "8VOS",
    32: "16VOS",
    64: "32VOS"
  }

  return roundMap[bracketSize] || "32VOS"
}

// =============================================================================
// UTILIDADES Y HELPERS
// =============================================================================

/**
 * Valida que los datos de entrada sean correctos
 */
export function validateCouplesData(couples: CoupleSeeded[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (couples.length === 0) {
    errors.push("No hay parejas para procesar")
    return { valid: false, errors }
  }

  couples.forEach((couple, index) => {
    if (!couple.id) {
      errors.push(`Pareja ${index + 1}: ID faltante`)
    }
    if (!couple.zona) {
      errors.push(`Pareja ${index + 1}: Zona faltante`)
    }
    if (typeof couple.puntos !== 'number') {
      errors.push(`Pareja ${index + 1}: Puntos debe ser un número`)
    }
    if (typeof couple.posicionEnZona !== 'number' || couple.posicionEnZona < 1) {
      errors.push(`Pareja ${index + 1}: Posición en zona debe ser un número mayor a 0`)
    }
  })

  return { valid: errors.length === 0, errors }
}

/**
 * Convierte matches del bracket a formato para insertar en la base de datos
 */
export function convertMatchesToDatabaseFormat(
  matches: BracketMatch[], 
  tournamentId: string
): any[] {
  return matches.map(match => ({
    tournament_id: tournamentId,
    couple1_id: match.pareja1?.id || null,
    couple2_id: match.pareja2?.id || null,
    round: match.round,
    order: match.order,
    status: match.status,
    winner_id: match.winner_id || null,
    type: 'ELIMINATION', // Todos los matches generados aquí son de eliminación
  }))
}

/**
 * Función de debug para mostrar el seeding paso a paso
 */
export function debugSeeding(couples: CoupleSeeded[]): void {
  console.log("=== DEBUG: Proceso de Seeding ===")
  
  // Mostrar datos de entrada
  console.log("Parejas de entrada:")
  couples.forEach(couple => {
    console.log(`  ID: ${couple.id}, Zona: ${couple.zona}, Posición: ${couple.posicionEnZona}, Puntos: ${couple.puntos}`)
  })

  // Mostrar seeding
  const seeded = assignGlobalSeeds(couples)
  console.log("\nSeeding asignado:")
  seeded.forEach(couple => {
    console.log(`  Seed ${couple.seed}: Zona ${couple.zona} (${couple.posicionEnZona}°), ${couple.puntos} pts`)
  })

  // Mostrar matches
  const matches = createBracketMatches(seeded, createBracketConfig(seeded.length))
  console.log("\nMatches generados:")
  matches.forEach(match => {
    const p1 = match.pareja1 ? `Seed ${match.pareja1.seed}` : 'BYE'
    const p2 = match.pareja2 ? `Seed ${match.pareja2.seed}` : 'BYE'
    console.log(`  ${match.round} - Match ${match.order}: ${p1} vs ${p2}`)
  })
}

// =============================================================================
// COMPATIBILIDAD CON CÓDIGO EXISTENTE
// =============================================================================

export interface CoupleWithStats extends Couple {
  stats?: {
    points: number;
  };
}

export interface ZoneWithRankedCouples extends Omit<Zone, 'couples'> {
  couples: CoupleWithStats[];
}

export interface KnockoutPairing {
  temp_id: string;
  round: Round;
  couple1: CoupleWithStats;
  couple2: CoupleWithStats | { id: "BYE_MARKER"; player_1: "BYE_PLAYER_ID"; player_2: "BYE_PLAYER_ID" };
}

// Mantener funciones existentes para compatibilidad
export function generateZones(participants: Couple[]): Zone[] {
  const zones: Zone[] = [];
  const mutableParticipants = [...participants];
  const n = mutableParticipants.length;

  if (n === 0) return [];
  if (n < 6) throw new Error(`El torneo requiere al menos 6 parejas. Recibidas: ${n}.`);

  let numZonesOf4 = 0;
  let numZonesOf3 = 0;

  switch (n % 4) {
    case 0:
      numZonesOf4 = n / 4;
      break;
    case 1:
      if (n < 9) throw new Error(`No se pueden formar zonas con ${n} parejas (resto 1). Se requieren al menos 9.`);
      numZonesOf4 = Math.floor(n / 4) - 2;
      numZonesOf3 = 3;
      break;
    case 2:
      numZonesOf4 = Math.floor(n / 4) - 1;
      numZonesOf3 = 2;
      break;
    case 3:
      numZonesOf4 = Math.floor(n / 4);
      numZonesOf3 = 1;
      break;
  }

  let zoneCounter = 0;
  const createAndAddZone = (numInZone: number) => {
    if (mutableParticipants.length < numInZone) {
      throw new Error(`Error interno: participantes insuficientes (${mutableParticipants.length}) para zona de ${numInZone}.`);
    }

    const zoneCouples: Couple[] = mutableParticipants.splice(0, numInZone);

    zones.push({
      id: `temp-zone-${zoneCounter}`,
      name: `Zone ${String.fromCharCode(65 + zoneCounter)}`,
      created_at: new Date().toISOString(),
      couples: zoneCouples,
    });

    zoneCounter++;
  };

  for (let i = 0; i < numZonesOf4; i++) createAndAddZone(4);
  for (let i = 0; i < numZonesOf3; i++) createAndAddZone(3);

  if (mutableParticipants.length > 0) {
    throw new Error(`Quedaron ${mutableParticipants.length} parejas sin asignar a zonas. Revisa la lógica de distribución.`);
  }

  return zones;
}

export function generateKnockoutRounds(zones: ZoneWithRankedCouples[]): KnockoutPairing[] {
  const allCouplesRaw: CoupleWithStats[] = zones.flatMap(zone => zone.couples);

  if (allCouplesRaw.length === 0) return [];

  const allCouples: CoupleWithStats[] = allCouplesRaw.map(c => ({
    ...c,
    stats: c.stats || { points: 0, played: 0, won: 0, lost: 0, scored: 0, conceded: 0 }
  }));

  allCouples.sort((a, b) => {
    const pointsA = a.stats?.points || 0;
    const pointsB = b.stats?.points || 0;
    return pointsB - pointsA;
  });

  const numCouples = allCouples.length;
  const bracketSize = Math.max(2, Math.pow(2, Math.ceil(Math.log2(numCouples))));
  const numByes = bracketSize - numCouples;
  const roundName = getRoundName(bracketSize);

  const pairings: KnockoutPairing[] = [];
  let matchIdCounter = 1;

  for (let i = 0; i < numByes; i++) {
    pairings.push({
      temp_id: `match-${matchIdCounter++}`,
      round: roundName,
      couple1: allCouples[i],
      couple2: { id: "BYE_MARKER", player_1: "BYE_PLAYER_ID", player_2: "BYE_PLAYER_ID", stats: { points: 0 } },
    });
  }

  const playingCouples: CoupleWithStats[] = allCouples.slice(numByes);
  const numPlayingCouples = playingCouples.length;

  for (let i = 0; i < Math.floor(numPlayingCouples / 2); i++) {
    pairings.push({
      temp_id: `match-${matchIdCounter++}`,
      round: roundName,
      couple1: playingCouples[i],
      couple2: playingCouples[numPlayingCouples - 1 - i],
    });
  }

  return pairings;
}

/**
 * Función de ejemplo para probar el algoritmo con datos simulados
 * Útil para testing y demostración
 */
export function exampleSeeding(): void {
  console.log("🎾 === EJEMPLO DE SEEDING PARA TORNEO DE PÁDEL ===\n");
  
  // Datos de ejemplo: 21 parejas en 6 zonas
  // IMPORTANTE: El orden de las zonas aquí simula el orden de creación
  const exampleCouples: CoupleSeeded[] = [
    // Zona A (1ra zona creada - 4 parejas)
    { id: "couple-01", zona: "Zone A", puntos: 9, posicionEnZona: 1 }, // 1° Zona A → Seed 1
    { id: "couple-02", zona: "Zone A", puntos: 7, posicionEnZona: 2 }, // 2° Zona A
    { id: "couple-03", zona: "Zone A", puntos: 4, posicionEnZona: 3 }, // 3° Zona A
    { id: "couple-04", zona: "Zone A", puntos: 3, posicionEnZona: 4 }, // 4° Zona A
    
    // Zona B (2da zona creada - 4 parejas)
    { id: "couple-05", zona: "Zone B", puntos: 9, posicionEnZona: 1 }, // 1° Zona B → Seed 2
    { id: "couple-06", zona: "Zone B", puntos: 6, posicionEnZona: 2 }, // 2° Zona B
    { id: "couple-07", zona: "Zone B", puntos: 5, posicionEnZona: 3 }, // 3° Zona B
    { id: "couple-08", zona: "Zone B", puntos: 1, posicionEnZona: 4 }, // 4° Zona B
    
    // Zona C (3ra zona creada - 4 parejas)
    { id: "couple-09", zona: "Zone C", puntos: 8, posicionEnZona: 1 }, // 1° Zona C → Seed 3
    { id: "couple-10", zona: "Zone C", puntos: 7, posicionEnZona: 2 }, // 2° Zona C
    { id: "couple-11", zona: "Zone C", puntos: 4, posicionEnZona: 3 }, // 3° Zona C
    { id: "couple-12", zona: "Zone C", puntos: 3, posicionEnZona: 4 }, // 4° Zona C
    
    // Zona D (4ta zona creada - 3 parejas)
    { id: "couple-13", zona: "Zone D", puntos: 9, posicionEnZona: 1 }, // 1° Zona D → Seed 4
    { id: "couple-14", zona: "Zone D", puntos: 6, posicionEnZona: 2 }, // 2° Zona D
    { id: "couple-15", zona: "Zone D", puntos: 3, posicionEnZona: 3 }, // 3° Zona D
    
    // Zona E (5ta zona creada - 3 parejas)
    { id: "couple-16", zona: "Zone E", puntos: 8, posicionEnZona: 1 }, // 1° Zona E → Seed 5
    { id: "couple-17", zona: "Zone E", puntos: 5, posicionEnZona: 2 }, // 2° Zona E
    { id: "couple-18", zona: "Zone E", puntos: 4, posicionEnZona: 3 }, // 3° Zona E
    
    // Zona F (6ta zona creada - 3 parejas)
    { id: "couple-19", zona: "Zone F", puntos: 7, posicionEnZona: 1 }, // 1° Zona F → Seed 6
    { id: "couple-20", zona: "Zone F", puntos: 6, posicionEnZona: 2 }, // 2° Zona F
    { id: "couple-21", zona: "Zone F", puntos: 2, posicionEnZona: 3 }, // 3° Zona F
  ];

  console.log("📋 Datos de entrada (21 parejas en 6 zonas):");
  const zonesData: { [zona: string]: CoupleSeeded[] } = {};
  const zoneOrderMap: string[] = []; // Mantener orden de aparición
  
  exampleCouples.forEach(couple => {
    if (!zonesData[couple.zona]) {
      zonesData[couple.zona] = [];
      zoneOrderMap.push(couple.zona);
    }
    zonesData[couple.zona].push(couple);
  });

  zoneOrderMap.forEach((zona, index) => {
    console.log(`\n  ${zona} (${index + 1}° zona creada):`);
    zonesData[zona].forEach(couple => {
      console.log(`    ${couple.posicionEnZona}° lugar - ${couple.id} (${couple.puntos} pts)`);
    });
  });

  // Generar seeding
  console.log("\n🎯 Seeds asignados (por posición en zona):");
  const seeded = assignGlobalSeeds(exampleCouples);
  
  let currentPosition = 0;
  [1, 2, 3, 4].forEach(position => {
    const couplesInPosition = seeded.filter(c => c.posicionEnZona === position);
    if (couplesInPosition.length > 0) {
      console.log(`\n  ${position}° de zona:`);
      couplesInPosition.forEach(couple => {
        console.log(`    Seed ${couple.seed.toString().padStart(2)}: Zona ${couple.zona} - ${couple.puntos} pts`);
      });
    }
  });

  // Generar bracket
  console.log("\n⚔️ Bracket generado (32 equipos):");
  const config = createBracketConfig(seeded.length);
  console.log(`   Tamaño del bracket: ${config.bracketSize}`);
  console.log(`   BYEs necesarios: ${config.numByes}`);
  console.log(`   Ronda inicial: ${config.initialRound}`);
  
  const matches = createBracketMatches(seeded, config);
  
  console.log("\n📝 Matches de la primera ronda:");
  matches.forEach(match => {
    const p1 = match.pareja1 ? `Seed ${match.pareja1.seed.toString().padStart(2)} (Zona ${match.pareja1.zona})` : 'BYE';
    const p2 = match.pareja2 ? `Seed ${match.pareja2.seed.toString().padStart(2)} (Zona ${match.pareja2.zona})` : 'BYE';
    const status = match.status === 'FINISHED' ? ' ✅' : '';
    console.log(`   Match ${match.order.toString().padStart(2)}: ${p1} vs ${p2}${status}`);
  });

  // Mostrar algunos matches destacados
  console.log("\n🌟 Matches destacados:");
  const match1vs32 = matches.find(m => 
    (m.pareja1?.seed === 1 || m.pareja2?.seed === 1) && 
    (m.pareja1?.seed === 32 || m.pareja2?.seed === 32)
  );
  if (match1vs32) {
    console.log(`   Seed 1 vs Seed 32: ${match1vs32.pareja1?.zona || 'BYE'} vs ${match1vs32.pareja2?.zona || 'BYE'}`);
  }

  const match2vs31 = matches.find(m => 
    (m.pareja1?.seed === 2 || m.pareja2?.seed === 2) && 
    (m.pareja1?.seed === 31 || m.pareja2?.seed === 31)
  );
  if (match2vs31) {
    console.log(`   Seed 2 vs Seed 31: ${match2vs31.pareja1?.zona || 'BYE'} vs ${match2vs31.pareja2?.zona || 'BYE'}`);
  }

  console.log("\n✅ ¡Algoritmo completado exitosamente!");
  console.log(`   - Total parejas procesadas: ${exampleCouples.length}`);
  console.log(`   - Seeds asignados: ${seeded.length}`);
  console.log(`   - Matches generados: ${matches.length}`);
  console.log(`   - BYEs automáticos: ${matches.filter(m => m.status === 'FINISHED').length}`);
}

// Función para testing rápido - descomenta para probar
// exampleSeeding();
