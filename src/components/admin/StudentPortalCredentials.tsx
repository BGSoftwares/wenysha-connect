import { useState } from "react";
import { Copy, KeyRound, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type StudentPortalCredentials = {
  username: string;
  temporary_password: string;
};

type Props = {
  credentials: StudentPortalCredentials;
  onClose: () => void;
};

export function StudentPortalCredentialsDialog({ credentials, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(
        `Username: ${credentials.username}\nTemporary password: ${credentials.temporary_password}`,
      );
      setCopied(true);
      toast.success("Student portal credentials copied.");
    } catch {
      toast.error("Could not copy credentials. Select and copy them manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <style>{`@media print { body * { visibility: hidden !important; } .student-credentials-print, .student-credentials-print * { visibility: visible !important; } .student-credentials-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; max-width: none !important; border: 0 !important; box-shadow: none !important; } .student-credentials-actions { display: none !important; } }`}</style>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-portal-credentials-title"
        className="student-credentials-print w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary/10 p-2 text-primary"><KeyRound className="h-5 w-5" /></span>
          <div>
            <h2 id="student-portal-credentials-title" className="text-lg font-bold">Student portal created</h2>
            <p className="mt-1 text-sm text-muted-foreground">Give these sign-in details to the student or their next of kin. This temporary password is shown once.</p>
          </div>
        </div>
        <dl className="space-y-3 rounded-xl border bg-background p-4">
          <div><dt className="text-xs font-semibold uppercase text-muted-foreground">Username / Student ID</dt><dd className="mt-1 break-all font-mono font-semibold">{credentials.username}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-muted-foreground">Temporary password</dt><dd className="mt-1 break-all font-mono font-semibold">{credentials.temporary_password}</dd></div>
        </dl>
        <p className="text-xs text-muted-foreground">At first sign-in, the student must set a new password before opening the portal.</p>
        <div className="student-credentials-actions flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
          <Button variant="gold" onClick={() => void copyCredentials()}><Copy className="mr-2 h-4 w-4" />{copied ? "Copied" : "Copy credentials"}</Button>
        </div>
      </section>
    </div>
  );
}
