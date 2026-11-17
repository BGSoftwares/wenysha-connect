import { useMemo, useRef, useState } from "react";
import { CircleCheck, FileUp, Landmark, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAssignBankDeposit, useBankDeposits, useIgnoreBankDeposit, useImportBankStatement, useInvoices, useOnlinePaymentConfig,
  type BankDeposit, type BankImportSummary,
} from "@/lib/hooks";
import { getErrorMessage } from "@/lib/api";
import { FINANCE_CURRENCIES, formatMoney, formatSchoolDate, type FinanceCurrency } from "@/lib/finance";

const ReviewRow = ({ deposit }: { deposit: BankDeposit }) => {
  const [invoiceId, setInvoiceId] = useState("");
  const { data: invoices = [] } = useInvoices();
  const assign = useAssignBankDeposit();
  const ignore = useIgnoreBankDeposit();

  const choices = useMemo(
    () => invoices.filter((invoice) => invoice.currency === deposit.currency && Number(invoice.amount) - Number(invoice.paid) >= Number(deposit.amount)),
    [invoices, deposit.currency, deposit.amount],
  );

  const credit = async () => {
    try {
      const result = await assign.mutateAsync({ id: deposit.id, invoice: Number(invoiceId) });
      toast.success(`Credited ${result.student_name} (${result.invoice_no})`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <p className="font-semibold">{formatMoney(deposit.amount, deposit.currency)}</p>
        <p className="text-xs text-muted-foreground">{formatSchoolDate(deposit.value_date)}</p>
      </td>
      <td className="px-4 py-3">
        <p className="max-w-xs break-words">{deposit.reference || "No reference"}</p>
        {deposit.payer_name && <p className="text-xs text-muted-foreground">{deposit.payer_name}</p>}
        <p className="mt-1 text-xs text-amber-700">{deposit.note}</p>
      </td>
      <td className="px-4 py-3">
        <label className="sr-only" htmlFor={`assign-${deposit.id}`}>Invoice to credit</label>
        <select
          id={`assign-${deposit.id}`}
          value={invoiceId}
          onChange={(event) => setInvoiceId(event.target.value)}
          className="w-full min-w-[14rem] rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Choose an invoice…</option>
          {choices.map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.student_name} · {invoice.invoice_no} · owes {formatMoney(Number(invoice.amount) - Number(invoice.paid), invoice.currency)}
            </option>
          ))}
        </select>
        {!choices.length && <p className="mt-1 text-xs text-muted-foreground">No open {deposit.currency} invoice has a balance this large.</p>}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" disabled={!invoiceId || assign.isPending} onClick={() => void credit()}>Credit invoice</Button>
          <Button
            size="sm" variant="outline" disabled={ignore.isPending}
            onClick={() => void ignore.mutateAsync(deposit.id).then(() => toast.success("Marked as not school fees")).catch((error) => toast.error(getErrorMessage(error)))}
          >
            Not fees
          </Button>
        </div>
      </td>
    </tr>
  );
};

const BankDepositsSection = () => {
  const { data: config } = useOnlinePaymentConfig();
  const review = useBankDeposits("unmatched");
  const matched = useBankDeposits("matched");
  const importer = useImportBankStatement();
  const fileInput = useRef<HTMLInputElement>(null);
  const [currency, setCurrency] = useState<FinanceCurrency>("USD");
  const [summary, setSummary] = useState<BankImportSummary | null>(null);
  const account = config?.bank_account;
  const queue = review.data ?? [];
  const credited = (matched.data ?? []).slice(0, 15);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setSummary(null);
    try {
      setSummary(await importer.mutateAsync({ file, currency }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Bank deposits</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Money paid straight into the school bank account is matched to the right student by the invoice number or student ID in the bank reference,
          then shows in the student's account and in Payments straight away.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="rounded-xl bg-primary/10 p-3 text-primary"><Landmark className="h-5 w-5" /></span>
          <div className="text-sm">
            <p className="font-semibold">{account?.account_name || "School account"} · {account?.bank} {account?.branch}</p>
            <p className="font-mono text-primary">{account?.account_number || "Account number not set"}</p>
            <p className="mt-2 text-muted-foreground">
              Parents are told to put the invoice number as the payment reference. Deposits with no usable reference wait in the review list below.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Import a bank statement</CardTitle>
          <p className="text-sm text-muted-foreground">
            Download the statement as CSV from internet banking and upload it. It needs a date, a credit or amount, and a reference or description column.
            Importing the same file twice never credits anyone twice.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="statement-currency" className="mb-1 block text-sm font-medium">Statement currency</label>
              <select id="statement-currency" value={currency} onChange={(event) => setCurrency(event.target.value as FinanceCurrency)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {FINANCE_CURRENCIES.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
              </select>
            </div>
            <input ref={fileInput} type="file" accept=".csv,text/csv" className="sr-only" id="statement-file" onChange={(event) => void upload(event.target.files?.[0])} />
            <Button type="button" disabled={importer.isPending} onClick={() => fileInput.current?.click()}>
              {importer.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing…</> : <><FileUp className="mr-2 h-4 w-4" />Choose statement CSV</>}
            </Button>
          </div>

          {summary && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950" role="status">
              <p className="font-semibold">
                {summary.created} new deposit{summary.created === 1 ? "" : "s"}: {summary.matched} credited automatically, {summary.needs_review} need your review.
              </p>
              <p className="mt-1 text-xs">
                {summary.duplicates} already imported{summary.skipped ? `, ${summary.skipped} lines skipped (withdrawals or unreadable)` : ""}.
              </p>
              {summary.errors.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs">{summary.errors.map((message) => <li key={message}>{message}</li>)}</ul>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-elegant">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Needs review {queue.length > 0 && <Badge className="ml-2 bg-amber-100 text-amber-900">{queue.length}</Badge>}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">The bank reference did not point to one invoice, or the amount did not fit. Choose the invoice to credit.</p>
          </div>
          <Button variant="outline" onClick={() => void Promise.all([review.refetch(), matched.refetch()])}>
            <RefreshCw className={`mr-2 h-4 w-4 ${review.isFetching ? "animate-spin" : ""}`} />Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr><th className="px-4 py-3 font-medium">Deposit</th><th className="px-4 py-3 font-medium">Bank reference</th><th className="px-4 py-3 font-medium">Credit to</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody className="divide-y">
                {queue.map((deposit) => <ReviewRow key={deposit.id} deposit={deposit} />)}
                {review.isLoading && <tr><td colSpan={4} className="px-4 py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
                {!review.isLoading && queue.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Nothing to review. Every deposit has been matched.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Recently credited</CardTitle>
          <p className="text-sm text-muted-foreground">The latest bank deposits that reached a student's account.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr><th className="px-4 py-3 font-medium">Student</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Receipt</th><th className="px-4 py-3 font-medium">Bank reference</th></tr>
              </thead>
              <tbody className="divide-y">
                {credited.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="px-4 py-3"><p className="flex items-center gap-1.5 font-medium"><CircleCheck className="h-4 w-4 text-emerald-600" />{deposit.student_name}</p><p className="pl-5 text-xs text-muted-foreground">{deposit.invoice_no}</p></td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(deposit.amount, deposit.currency)}</td>
                    <td className="px-4 py-3">{formatSchoolDate(deposit.value_date)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{deposit.receipt_no}</td>
                    <td className="max-w-xs break-words px-4 py-3 text-xs text-muted-foreground">{deposit.reference}</td>
                  </tr>
                ))}
                {!matched.isLoading && credited.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No bank deposits have been credited yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankDepositsSection;
