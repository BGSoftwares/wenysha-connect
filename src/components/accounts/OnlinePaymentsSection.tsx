import { useState } from "react";
import { Loader2, RefreshCw, Smartphone, CreditCard, CircleCheck, CircleX, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnlinePaymentConfig, useOnlinePayments, useRefreshOnlinePayment } from "@/lib/hooks";
import { formatMoney, formatSchoolDate } from "@/lib/finance";

const providerLabels = { ecocash: "EcoCash", zimswitch: "ZimSwitch" } as const;

const OnlinePaymentsSection = () => {
  const { data: config, isLoading: loadingConfig } = useOnlinePaymentConfig();
  const { data: payments = [], isLoading: loadingPayments, refetch } = useOnlinePayments();
  const [refreshReference, setRefreshReference] = useState("");
  const refreshQuery = useRefreshOnlinePayment(refreshReference, Boolean(refreshReference));

  const refreshPayment = async (reference: string) => {
    await refetch();
    if (reference === refreshReference) {
      await refreshQuery.refetch();
    } else {
      setRefreshReference(reference);
    }
  };

  const isLoading = loadingConfig || loadingPayments;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Online fee payments</h2>
        <p className="mt-1 text-sm text-muted-foreground">Track verified EcoCash and ZimSwitch payments and see which Zimbabwe payment channels are configured.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {([
          { key: "ecocash", name: "EcoCash", Icon: Smartphone, hint: "Mobile wallet prompt to the payer's Zimbabwe number." },
          { key: "zimswitch", name: "ZimSwitch", Icon: CreditCard, hint: "Secure hosted checkout for ZimSwitch enabled bank cards." },
        ] as const).map(({ key, name, Icon, hint }) => {
          const provider = config?.providers[key];
          return (
            <Card key={key} className="border-none shadow-elegant">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="flex min-w-0 gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{name}</h3>
                      {provider?.enabled
                        ? <Badge className="bg-emerald-100 text-emerald-800">Ready</Badge>
                        : <Badge variant="outline">Needs merchant setup</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Currencies: {provider?.currencies.join(", ") || "USD (default)"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loadingConfig && (!config?.providers.ecocash.enabled || !config?.providers.zimswitch.enabled) && (
        <Card className="border-amber-300 bg-amber-50/70 dark:bg-amber-950/20">
          <CardContent className="p-5 text-sm text-amber-950 dark:text-amber-100">
            <p className="font-semibold">Merchant credentials are required before checkout can accept money.</p>
            <p className="mt-1">Ask the school’s EcoCash merchant contact and acquiring bank/ZimSwitch for the approved credentials, then add them to the backend environment using the keys in <code>backend/.env.example</code>. Keep those values on the server.</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-elegant">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Checkout activity</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">A payment only enters the fee ledger after the provider confirms it.</p>
          </div>
          <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh list
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Student / Invoice</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => {
                  const Icon = payment.status === "paid" ? CircleCheck : payment.status === "failed" || payment.status === "cancelled" ? CircleX : Clock3;
                  const statusClass = payment.status === "paid" ? "text-emerald-700" : payment.status === "failed" || payment.status === "cancelled" ? "text-destructive" : "text-amber-700";
                  return (
                    <tr key={payment.id}>
                      <td className="px-4 py-3"><p className="font-medium">{payment.student_name}</p><p className="text-xs text-muted-foreground">{payment.invoice_no}</p></td>
                      <td className="px-4 py-3">{providerLabels[payment.provider]}</td>
                      <td className="px-4 py-3 font-semibold">{formatMoney(payment.amount, payment.currency)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{payment.client_reference}</td>
                      <td className="px-4 py-3">{formatSchoolDate(payment.created_at)}</td>
                      <td className={`px-4 py-3 capitalize ${statusClass}`}><span className="inline-flex items-center gap-1"><Icon className="h-4 w-4" />{payment.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        {payment.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => void refreshPayment(payment.client_reference)} disabled={refreshQuery.isFetching && refreshReference === payment.client_reference}>
                            <RefreshCw className={`mr-1 h-4 w-4 ${refreshQuery.isFetching && refreshReference === payment.client_reference ? "animate-spin" : ""}`} />Check
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && payments.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No online fee checkouts yet.</td></tr>}
                {isLoading && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnlinePaymentsSection;
