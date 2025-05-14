"use client"

import { useState } from "react"
// Removed Convex imports: useMutation, api

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner" // Assuming sonner is still used for toasts, adjust if not

interface TournamentHeaderActionsProps {
  // tournamentId: string; // No longer needed if actions handle it or are bound
  isStarting: boolean; // To disable buttons during action
  isStarted: boolean;
  isCompleted: boolean;
  onStartTournament: () => Promise<void>; // Server action prop
  onFinalizeTournament: () => Promise<void>; // Server action prop
  canStartTournament: boolean; // To control visibility/state of start button
}

export const TournamentHeaderActions = ({
  isStarting,
  isStarted,
  isCompleted,
  onStartTournament,
  onFinalizeTournament,
  canStartTournament,
}: TournamentHeaderActionsProps) => {
  const [confirmStartDialogOpen, setConfirmStartDialogOpen] = useState(false)
  const [confirmEndDialogOpen, setConfirmEndDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false); // General processing state

  // Removed Convex-specific useMutation hooks

  const handleStartTournament = async () => {
    setIsProcessing(true);
    try {
      await onStartTournament();
      // Toast success is likely handled by the calling component or server action response
      setConfirmStartDialogOpen(false);
    } catch (error) {
      // Toast error is likely handled by the calling component or server action response
      console.error("Failed to start tournament from header actions", error);
    }
    setIsProcessing(false);
  }

  const handleEndTournament = async () => {
    setIsProcessing(true);
    try {
      await onFinalizeTournament();
      // Toast success is likely handled by the calling component or server action response
      setConfirmEndDialogOpen(false);
    } catch (error) {
      // Toast error is likely handled by the calling component or server action response
      console.error("Failed to end tournament from header actions", error);
    }
    setIsProcessing(false);
  }

  return (
    <div className="flex items-center gap-x-2">
      {/* Use canStartTournament to determine if start button should be shown/enabled */}
      {/* Also consider isStarted and isCompleted for visibility */}
      {!isStarted && !isCompleted && canStartTournament && (
        <Dialog open={confirmStartDialogOpen} onOpenChange={setConfirmStartDialogOpen}>
          <DialogTrigger asChild>
            {/* Disabled if another action is processing OR if it can't be started */}
            <Button variant="default" disabled={isProcessing || !canStartTournament}>
              Start Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Start Tournament</DialogTitle>
              <DialogDescription className="text-slate-500">
                Are you sure you want to start this tournament? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => setConfirmStartDialogOpen(false)}
                  disabled={isProcessing} // Disabled during processing
                  className="border-slate-200 text-slate-500"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button variant="default" disabled={isProcessing} onClick={handleStartTournament}> {/* Changed to handleStartTournament */}
                Start
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isStarted && !isCompleted && (
        <Dialog open={confirmEndDialogOpen} onOpenChange={setConfirmEndDialogOpen}>
          <DialogTrigger asChild>
            {/* isStarting prop was for Convex, using local isProcessing now */}
            <Button variant="destructive" disabled={isProcessing}> 
              End Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>End Tournament</DialogTitle>
              <DialogDescription className="text-slate-500">
                Are you sure you want to end this tournament? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => setConfirmEndDialogOpen(false)}
                  disabled={isProcessing} // Disabled during processing
                  className="border-slate-200 text-slate-500"
                >
                  Cancel
                </Button>
              </DialogClose>
              {/* Changed to handleEndTournament */}
              <Button variant="destructive" disabled={isProcessing} onClick={handleEndTournament}> 
                End
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
