import { useEffect, useRef, useState } from "react";
import { CreditCard, Landmark, Loader2, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlinePaymentConfig, useOnlinePayments, useRefreshOnlinePayment, useStartOnlinePayment, type Invoice, type OnlinePayment } from "@/lib/hooks";
import { formatMoney } from "@/lib/finance";
import { getErrorMessage } from "@/lib/api";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  studentName: string;
}

type Provider = OnlinePayment["provider"];

const PaymentModal = ({ isOpen, onClose, invoice, studentName }: PaymentModalProps) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [clientReference, setClientReference] = useState("");
  const [checkout, setCheckout] = useState<OnlinePayment | null>(null);
  const [error, setError] = useState("");
  const { data: config, isLoading: loadingConfig } = useOnlinePaymentConfig();
  const startPayment = useStartOnlinePayment();
  const {
    data: existingPayments,
    isLoading: checkingPendingPayment,
    isError: pendingPaymentCheckFailed,
    error: pendingPaymentCheckError,
    refetch: refetchPendingPayments,
  } = useOnlinePayments(invoice ? { invoice: invoice.id, status: "pending" } : undefined, isOpen && !!invoice);
  const { data: paymentStatus, isLoading: checkingPaymentStatus } = useRefreshOnlinePayment(clientReference, Boolean(clientReference) && isOpen);
  const balance = invoice ? Math.max(0, Number(invoice.amount) - Number(invoice.paid)) : 0;
  const invoiceId = invoice?.id;
  const initializedInvoiceId = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || invoiceId === undefined || initializedInvoiceId.current === invoiceId) return;
    initializedInvoiceId.current = invoiceId;
    setAmount(balance.toFixed(2));
    setProvider(null);
    setPhone("");
    setClientReference("");
    setCheckout(null);
    setError("");
  }, [isOpen, invoiceId, balance]);

  useEffect(() => {
    if (!isOpen || invoiceId === undefined || checkingPendingPayment || pendingPaymentCheckFailed || !existingPayments?.length) return;
    const pending = existingPayments.find((payment) => payment.invoice === invoiceId && payment.status === "pending");
    if (!pending) return;
    if (clientReference && clientReference !== pending.client_reference) return;

    setProvider(pending.provider);
    if (!clientReference) setClientReference(pending.client_reference);
    if (
      pending.provider === "zimswitch"
      && pending.checkout_id
      && config?.providers.zimswitch.widget_url
      && checkout?.checkout_id !== pending.checkout_id
    ) {
      const shopperResultUrl = new URL("/payment/return", window.location.origin);
      shopperResultUrl.searchParams.set("ref", pending.client_reference);
      setCheckout({
        ...pending,
        widget_url: config.providers.zimswitch.widget_url,
        brands: config.providers.zimswitch.brands,
        shopper_result_url: shopperResultUrl.toString(),
      });
    }
  }, [isOpen, invoiceId, checkingPendingPayment, pendingPaymentCheckFailed, existingPayments, clientReference, config, checkout?.checkout_id]);

  useEffect(() => {
    if (!checkout?.checkout_id || !checkout.widget_url) return;
    const script = document.createElement("script");
    script.src = `${checkout.widget_url}?checkoutId=${encodeURIComponent(checkout.checkout_id)}`;
    script.async = true;
    script.onerror = () => setError("ZimSwitch checkout could not load. Please close this window and try again.");
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [checkout?.checkout_id, checkout?.widget_url]);

  if (!isOpen || !invoice) return null;

  const providerAllowed = (method: Provider) => {
    if (method === "bank_transfer") return true;
    const methodConfig = config?.providers[method];
    return Boolean(methodConfig?.enabled && methodConfig.currencies.includes(invoice.currency));
  };

  const handlePayment = async () => {
    if (!provider) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > balance) {
      setError(`Enter an amount above zero and no greater than ${formatMoney(balance, invoice.currency)}.`);
      return;
    }
    if (provider === "ecocash" && !phone.trim()) {
      setError("Enter the EcoCash number that should receive the payment prompt.");
      return;
    }

    setError("");
    try {
      const result = await startPayment.mutateAsync({ invoice: invoice.id, amount: value, provider, ...(provider === "ecocash" ? { phone } : {}), ...(provider === "bank_transfer" ? { reference: phone } : {}) });
      setClientReference(result.client_reference);
      if (provider === "zimswitch") setCheckout(result);
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  };

  const retryPayment = () => {
    setClientReference("");
    setCheckout(null);
    setProvider(null);
    setError("");
  };

  const currentStatus = paymentStatus?.status || checkout?.status;
  const methodOptions: { id: Provider; name: string; description: string; Icon: typeof Smartphone }[] = [
    { id: "ecocash", name: "EcoCash", description: "Approve a wallet prompt on your Zimbabwe mobile number.", Icon: Smartphone },
    { id: "zimswitch", name: "ZimSwitch", description: "Pay securely in the hosted card checkout.", Icon: CreditCard },
    { id: "bank_transfer", name: "NBS Bank Transfer", description: "Direct deposit or transfer to the school NBS account.", Icon: Landmark },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
      <section className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card shadow-xl" role="dialog" aria-modal="true" aria-labelledby="fee-payment-title">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div><h2 id="fee-payment-title" className="font-heading text-lg font-bold">Pay school fees</h2><p className="text-xs text-muted-foreground">Secure online checkout</p></div>
          <button onClick={onClose} aria-label="Close payment window" className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-4 p-4">
          <div className="rounded-lg bg-secondary/30 p-4">
            <p className="text-sm text-muted-foreground">Student</p><p className="font-medium">{studentName}</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
              <div><p className="text-sm text-muted-foreground">Invoice</p><p className="font-medium">{invoice.invoice_no} · {invoice.term}</p></div>
              <div className="text-right"><p className="text-sm text-muted-foreground">Outstanding</p><p className="text-xl font-bold text-primary">{formatMoney(balance, invoice.currency)}</p></div>
            </div>
          </div>

          {checkingPendingPayment && <p className="text-sm text-muted-foreground" aria-live="polite">Checking for a payment already awaiting confirmation…</p>}
          {pendingPaymentCheckFailed && <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
            <p>We couldn’t check whether this invoice already has a pending payment: {getErrorMessage(pendingPaymentCheckError)}</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void refetchPendingPayments()}>Try again</Button>
          </div>}

          {currentStatus === "paid" ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Payment confirmed</p><p className="mt-1">Your invoice is being updated with the verified payment.</p>
            </div>
          ) : currentStatus === "failed" ? (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <p>Payment was not confirmed. Check your details and try again or contact Accounts.</p>
              <Button type="button" variant="outline" onClick={retryPayment}>Try another payment</Button>
            </div>
          ) : checkout?.checkout_id && provider === "zimswitch" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter card details in the secure ZimSwitch hosted checkout. Your card details are not stored by the school.</p>
              <form action={checkout.shopper_result_url} className="paymentWidgets" data-brands={checkout.brands || "VISA MASTER PRIVATE_LABEL"} />
              <p className="text-xs text-muted-foreground">Checkout reference: {checkout.client_reference}</p>
              {currentStatus === "pending" && <p className="text-xs text-amber-700">Waiting for ZimSwitch to confirm the result…</p>}
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="fee-payment-amount" className="mb-2 block text-sm font-medium">Amount ({invoice.currency})</label>
                <input id="fee-payment-amount" type="number" inputMode="decimal" min="0.01" max={balance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground" />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Choose payment method</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {methodOptions.map(({ id, name, description, Icon }) => {
                    const available = providerAllowed(id);
                    return (
                      <button type="button" key={id} disabled={!available || loadingConfig || Boolean(clientReference) || checkingPendingPayment || pendingPaymentCheckFailed} onClick={() => setProvider(id)} className={`rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${provider === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                        <span className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-primary" />{name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{available ? description : loadingConfig ? "Checking availability…" : `Not enabled for ${invoice.currency}; ask Accounts.`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {provider === "ecocash" && (
                <div>
                  <label htmlFor="ecocash-phone" className="mb-2 block text-sm font-medium">EcoCash mobile number</label>
                  <input id="ecocash-phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground" placeholder="077 123 4567" />
                  <p className="mt-1 text-xs text-muted-foreground">You will receive a prompt on your phone to approve the payment.</p>
                </div>
              )}

              {provider === "bank_transfer" && (
                <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                  <p className="font-semibold text-primary">School NBS Bank Account Details</p>
                  <div className="grid gap-2 text-xs">
                    <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Account Name:</span><span className="font-bold">ABLE GOD COLLEGE</span></div>
                    <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Account Number:</span><span className="font-mono font-bold text-primary">3252015253451</span></div>
                    <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Bank:</span><span className="font-semibold">NBS (National Building Society)</span></div>
                    <div className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Branch:</span><span className="font-semibold">MASVINGO</span></div>
                    <div className="flex justify-between pt-0.5"><span className="text-muted-foreground">Reference:</span><span className="font-mono font-semibold">{invoice.invoice_no}</span></div>
                  </div>
                  <div>
                    <label htmlFor="bank-transfer-ref" className="mt-2 mb-1 block text-xs font-medium">Bank Transaction / Deposit Slip Reference</label>
                    <input id="bank-transfer-ref" type="text" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground" placeholder="e.g. NBS-TXN-12345 or Teller Slip No." />
                    <p className="mt-1 text-[11px] text-muted-foreground">Enter your transaction or deposit slip number. Once verified by Accounts, it will immediately reflect in your portal.</p>
                  </div>
                </div>
              )}

              {clientReference && !paymentStatus && checkingPaymentStatus && <p className="text-sm text-muted-foreground" aria-live="polite">Checking the existing payment status…</p>}
              {currentStatus === "pending" && clientReference && (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950">
                  <p className="font-semibold">{provider === "bank_transfer" ? "NBS Bank Transfer recorded" : "Payment request sent"}</p>
                  <p className="mt-1 text-xs">Reference: <span className="font-mono font-semibold">{clientReference}</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {provider === "bank_transfer"
                      ? "Pay into ABLE GOD COLLEGE, NBS Masvingo Branch (Acc: 3252015253451). Accounts will verify your deposit and credit your invoice."
                      : "Approve the prompt on your phone; the invoice changes after provider confirmation."}
                  </p>
                </div>
              )}
            </>
          )}

          {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}

          <footer className="flex gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Close</Button>
            {!checkout?.checkout_id && currentStatus !== "paid" && currentStatus !== "failed" && (
              <Button type="button" className="flex-1" disabled={!provider || !providerAllowed(provider) || startPayment.isPending || Boolean(clientReference) || checkingPendingPayment || pendingPaymentCheckFailed} onClick={() => void handlePayment()}>
                {startPayment.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting…</> : `Continue · ${formatMoney(Number(amount) || 0, invoice.currency)}`}
              </Button>
            )}
          </footer>
          <p className="text-center text-xs text-muted-foreground">Payments are processed by EcoCash or ZimSwitch. Never share your PIN or card security code with school staff.</p>
        </div>
      </section>
    </div>
  );
};

export default PaymentModal;
