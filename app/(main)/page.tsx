import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Trophy,
  TrendingUp,
  Users,
  Bell,
  Calendar,
  BarChart3,
  Target,
  Building2,
  Eye,
  Star,
  ArrowRight,
  CheckCircle,
  MapPin,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Info,
  User,
  Lightbulb,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { LOGOS } from "@/lib/supabase-storage"

// OPTIMIZED: Lazy load the heavy bracket demo component
const EnhancedBracketDemo = dynamic(
  () => import("@/components/home/enhance-bracket-demo"),
  { 
    loading: () => <BracketDemoSkeleton />
  }
)

// Componentes optimizados
import { HeroSection } from "@/components/home/HeroSection"
import { RankingSection } from "@/components/home/RankingSection"
import { PlayerFeaturesSection } from "@/components/home/PlayerFeaturesSection"
import { ClubsSection } from "@/components/home/ClubsSection"
import { TournamentsSection } from "@/components/home/TournamentsSection"
import { WeeklyWinnersSection } from "@/components/home/WeeklyWinnersSection"
import { InfoSection } from "@/components/home/InfoSection"
import { CoachesSection } from "@/components/home/CoachesSection"
import { CTASection } from "@/components/home/CTASection"
import { FooterSection } from "@/components/home/FooterSection"

// Skeletons
import { RankingSkeleton } from "@/components/skeletons/RankingSkeleton"
import { ClubsSkeleton } from "@/components/skeletons/ClubsSkeleton"
import { TournamentsSkeleton } from "@/components/skeletons/TournamentsSkeleton"
import { WeeklyWinnersSkeleton } from "@/components/skeletons/WeeklyWinnersSkeleton"
import { BracketDemoSkeleton } from "@/components/skeletons/BracketDemoSkeleton"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Se carga inmediatamente */}
      <HeroSection />

      {/* Ranking Section - Con Suspense */}
      <Suspense fallback={<RankingSkeleton />}>
        <RankingSection />
      </Suspense>

      {/* Player Features - Estático, se carga inmediatamente */}
      <PlayerFeaturesSection />

      {/* Clubs Section - Con Suspense */}
      <Suspense fallback={<ClubsSkeleton />}>
        <ClubsSection />
      </Suspense>

      {/* Sistema de Gestión Profesional - Bracket Demo (OPTIMIZED: Lazy loaded, Next.js 15 compatible) */}
      <EnhancedBracketDemo />

      {/* Información para Nuevos Usuarios - Estático */}
      <InfoSection />

      {/* Próximamente: Entrenadores - Estático */}
      <CoachesSection />

      {/* Torneos Disponibles - Con Suspense */}
      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentsSection />
      </Suspense>

      {/* Ganadores de la Semana - Con Suspense */}
      <Suspense fallback={<WeeklyWinnersSkeleton />}>
        <WeeklyWinnersSection />
      </Suspense>

      {/* CTA Final - Estático */}
      <CTASection />

      {/* Footer - Estático */}
      <FooterSection />
    </div>
  )
}
