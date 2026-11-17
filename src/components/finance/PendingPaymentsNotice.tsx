import { Clock3 } from "lucide-react";
import { useOnlinePayments } from "@/lib/hooks";
import { formatMoney } from "@/lib/finance";

const providerNames = { ecocash: "EcoCash", zimswitch: "ZimSwitch", bank_transfer: "Bank transfer" } as const;

/** Tells a parent or student that a payment was started and is waiting for confirmation. It disappears by itself. */
const PendingPaymentsNotice = ({ invoiceIds }: { invoiceIds?: number[] }) => {
  const { data: pending = [] } = useOnlinePayments({ status: "pending" });
  const waiting = pending.filter((payment) => payment.provider !== "bank_transfer" && (!invoiceIds || invoiceIds.includes(payment.invoice)));
  if (!waiting.length) return null;
  return (
    <div role="status" className="space-y-1 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      {waiting.map((payment) => (
        <p key={payment.id} className="flex items-start gap-2">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {providerNames[payment.provider]} payment of <strong>{formatMoney(payment.amount, payment.currency)}</strong> for {payment.invoice_no} is
            waiting for confirmation. It will show as paid here automatically, so you don't need to pay again.
          </span>
        </p>
      ))}
    </div>
  );
};

export default PendingPaymentsNotice;
