'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function CreateTournamentClientButton() {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        asChild
        className="bg-gradient-to-r from-violet-600 to-emerald-500 hover:opacity-90 text-white rounded-xl px-8 py-7 text-lg font-medium shadow-lg"
      >
        <Link href="/my-tournaments/create">
          <Plus className="mr-2 h-5 w-5" />
          Crear Nuevo Torneo
        </Link>
      </Button>
    </motion.div>
  );
} 