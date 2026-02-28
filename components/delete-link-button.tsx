"use client";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { deleteUrl } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteLinkButton({ id, onDeletingChange }: { id: string; onDeletingChange?: (deleting: boolean) => void }) {
  const queryClient = useQueryClient();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 size={16} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il link?</AlertDialogTitle>
          <AlertDialogDescription>
            Questa azione è irreversibile. Il link e tutti i suoi dati analytics verranno eliminati definitivamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={async () => {
              onDeletingChange?.(true);
              try {
                await deleteUrl(id);
                await queryClient.invalidateQueries({ queryKey: ["urls"] });
                await queryClient.invalidateQueries({ queryKey: ["analytics"] });
                toast.success("Link eliminato");
              } catch {
                onDeletingChange?.(false);
                toast.error("Errore durante l'eliminazione");
              }
            }}
          >
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
