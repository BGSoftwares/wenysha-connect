import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, CircleX, Clock3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRefreshOnlinePayment } from "@/lib/hooks";
import { formatMoney } from "@/lib/finance";

const PaymentReturn = () => {
  const [params] = useSearchParams();
  const reference = params.get("ref") || "";
  const { data: payment, isLoading, isError, error } = useRefreshOnlinePayment(reference, Boolean(reference));

  const paid = payment?.status === "paid";
  const failed = payment?.status === "failed" || payment?.status === "cancelled";
  const Icon = paid ? CheckCircle2 : failed ? CircleX : isLoading ? Loader2 : Clock3;
  const iconClass = paid ? "text-emerald-600" : failed ? "text-destructive" : "text-amber-600";
  const message = paid
    ? "ZimSwitch confirmed your payment. The school fee ledger has been updated."
    : failed
      ? "ZimSwitch did not confirm this payment. If your account was debited, contact the school Accounts office with this reference."
      : isError
        ? error instanceof Error ? error.message : "Sign in to view the confirmed payment status."
        : "We are checking the payment securely with ZimSwitch. This page will update when confirmation arrives.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <Icon className={`mx-auto h-12 w-12 ${iconClass} ${isLoading ? "animate-spin" : ""}`} />
        <h1 className="mt-4 text-2xl font-bold">{paid ? "Payment confirmed" : failed ? "Payment not completed" : "Checking payment"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {payment && <div className="mt-5 rounded-lg bg-muted/50 p-4 text-left text-sm">
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Invoice</span><span className="font-medium">{payment.invoice_no}</span></div>
          <div className="mt-2 flex justify-between gap-3"><span className="text-muted-foreground">Amount</span><span className="font-medium">{formatMoney(payment.amount, payment.currency)}</span></div>
          <div className="mt-2 flex justify-between gap-3"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">{payment.client_reference}</span></div>
        </div>}
        {!reference && <p className="mt-4 text-sm text-destructive">The payment reference is missing from this return address.</p>}
        {isError && <p className="mt-4 text-xs text-muted-foreground">If you are signed out, sign in and check Fees &amp; Payments for the current status.</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {isError && <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>}
          <Button asChild><Link to="/student">Return to student portal</Link></Button>
        </div>
      </section>
    </main>
  );
};

export default PaymentReturn;
