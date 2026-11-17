import { useMemo } from "react";
import { CheckCircle2, CreditCard, Landmark, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlinePaymentConfig, type Invoice } from "@/lib/hooks";
import { formatMoney, type FinanceCurrency } from "@/lib/finance";

interface ParentFeesPanelProps {
  childName: string;
  invoices: Invoice[];
  loading: boolean;
  onPay: (invoice: Invoice) => void;
  onViewAll: () => void;
}

/** The first thing a parent sees: what is owed for the selected child and a clear way to pay it. */
const ParentFeesPanel = ({ childName, invoices, loading, onPay, onViewAll }: ParentFeesPanelProps) => {
  const { data: config } = useOnlinePaymentConfig();

  const totals = useMemo(() => {
    const byCurrency = new Map<FinanceCurrency, { billed: number; paid: number; open: Invoice[] }>();
    for (const invoice of invoices) {
      const entry = byCurrency.get(invoice.currency) ?? { billed: 0, paid: 0, open: [] };
      entry.billed += Number(invoice.amount);
      entry.paid += Number(invoice.paid);
      if (Number(invoice.amount) > Number(invoice.paid)) entry.open.push(invoice);
      byCurrency.set(invoice.currency, entry);
    }
    return Array.from(byCurrency.entries()).map(([currency, entry]) => {
      const open = [...entry.open].sort((a, b) => a.date.localeCompare(b.date));
      return { currency, billed: entry.billed, paid: entry.paid, balance: Math.max(0, entry.billed - entry.paid), open };
    });
  }, [invoices]);

  const owing = totals.filter((row) => row.balance > 0);
  const methods = [
    { label: "EcoCash", Icon: Smartphone, on: Boolean(config?.providers.ecocash.enabled) },
    { label: "ZimSwitch card", Icon: CreditCard, on: Boolean(config?.providers.zimswitch.enabled) },
    { label: "Bank transfer", Icon: Landmark, on: true },
  ];
  const onlineReady = methods[0].on || methods[1].on;

  return (
    <section aria-labelledby="parent-fees-title" className="rounded-3xl border border-border bg-card p-6 shadow-xl md:p-8">
      <h2 id="parent-fees-title" className="text-sm font-medium text-muted-foreground">School fees for {childName}</h2>

      {loading ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          <div className="h-12 w-56 animate-pulse rounded-lg bg-muted" />
          <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
        </div>
      ) : !totals.length ? (
        <p className="mt-4 text-foreground">No fees have been billed for {childName} yet. Invoices from the school will appear here.</p>
      ) : owing.length === 0 ? (
        <div className="mt-4 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-7 w-7" /></span>
          <div>
            <p className="font-heading text-2xl font-semibold text-foreground">Fees are fully paid</p>
            <button type="button" onClick={onViewAll} className="text-sm font-medium text-accent underline-offset-4 hover:underline">View receipts and invoices</button>
          </div>
        </div>
      ) : (
        <div className="mt-2 divide-y divide-border">
          {owing.map((row) => {
            const next = row.open[0];
            const percent = row.billed > 0 ? Math.min(100, (row.paid / row.billed) * 100) : 0;
            return (
              <div key={row.currency} className="space-y-4 py-5 first:pt-3 last:pb-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance due · {row.open.length} invoice{row.open.length === 1 ? "" : "s"}</p>
                    <p className="font-heading text-4xl font-semibold tabular-nums text-foreground md:text-5xl">{formatMoney(row.balance, row.currency)}</p>
                  </div>
                  <Button size="lg" variant="gold" className="rounded-xl px-8 text-base" onClick={() => onPay(next)}>
                    Pay now
                  </Button>
                </div>
                <div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100} aria-label={`Fees paid in ${row.currency}`}>
                    <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatMoney(row.paid, row.currency)} of {formatMoney(row.billed, row.currency)} paid
                    {row.open.length > 1 ? ` · Pay now starts with ${next.invoice_no}` : ` · ${next.invoice_no}, ${next.term}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && owing.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <ul className="flex flex-wrap items-center gap-2" aria-label="Ways to pay">
            {methods.map(({ label, Icon, on }) => (
              <li key={label} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${on ? "border-primary/25 bg-primary/5 text-foreground" : "border-border text-muted-foreground line-through opacity-60"}`}>
                <Icon className="h-3.5 w-3.5" />{label}
              </li>
            ))}
            <li className="ml-auto">
              <button type="button" onClick={onViewAll} className="text-xs font-medium text-accent underline-offset-4 hover:underline">All invoices and receipts</button>
            </li>
          </ul>
          {!onlineReady && (
            <p className="mt-3 text-xs text-muted-foreground">
              EcoCash and card payments are not switched on yet. Choose Pay now, then bank transfer, and use the invoice number as your
              reference; your payment is credited automatically.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default ParentFeesPanel;
