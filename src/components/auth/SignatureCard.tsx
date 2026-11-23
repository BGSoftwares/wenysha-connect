import { useRef } from "react";
import { PenLine, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api";
import { useMySignature, useRemoveSignature, useUploadSignature } from "@/lib/hooks";

const ACCEPTED = "image/png,image/jpeg,image/webp";
const MAX_BYTES = 1024 * 1024;

/**
 * Teachers and the principal upload their signature once; it is printed on every report card
 * they comment on. Shown only to roles that sign (the server enforces this too).
 */
export const SignatureCard = ({ role }: { role?: string }) => {
  const signsReports = ["admin", "administrator", "principal", "teacher", "class teacher"].includes((role ?? "").toLowerCase());
  const { data, isLoading } = useMySignature(signsReports);
  const upload = useUploadSignature();
  const remove = useRemoveSignature();
  const input = useRef<HTMLInputElement>(null);
  if (!signsReports) return null;

  const choose = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("The signature image must be smaller than 1 MB.");
      return;
    }
    try {
      await upload.mutateAsync(file);
      toast.success("Signature saved. It will appear on report cards you approve.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6" aria-labelledby="signature-heading">
      <h3 id="signature-heading" className="flex items-center gap-2 font-semibold">
        <PenLine className="h-4 w-4 text-primary" />
        My signature
      </h3>
      <p className="text-sm text-muted-foreground">
        Upload a clear photo or scan of your signature on white paper. It is printed above your name on the report cards you comment on.
      </p>
      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed bg-white p-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data?.url ? (
          <img src={data.url} alt="Your uploaded signature" className="max-h-full max-w-full object-contain" />
        ) : (
          <p className="text-sm text-muted-foreground">No signature uploaded yet.</p>
        )}
      </div>
      <input ref={input} type="file" accept={ACCEPTED} className="sr-only" aria-label="Choose signature image" onChange={(event) => void choose(event.target.files?.[0])} />
      <div className="flex flex-wrap gap-2">
        <Button variant="gold" disabled={upload.isPending} onClick={() => input.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {upload.isPending ? "Uploading…" : data?.url ? "Replace signature" : "Upload signature"}
        </Button>
        {data?.url && (
          <Button variant="outline" disabled={remove.isPending} onClick={() => remove.mutate(undefined, { onError: (error) => toast.error(getErrorMessage(error)) })}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">PNG, JPG or WebP, up to 1 MB.</p>
    </section>
  );
};
