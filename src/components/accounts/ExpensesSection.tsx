import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  EXPENSE_CATEGORIES, useCreateExpense, useDeleteExpense, useExpenses, useIncomeExpenseSummary, type ExpenseCategory,
} from "@/lib/hooks";
import { getErrorMessage } from "@/lib/api";
import { FINANCE_CURRENCIES, formatMoney, formatSchoolDate, schoolDateInput, type FinanceCurrency } from "@/lib/finance";

const emptyForm = () => ({
  date: schoolDateInput(), category: "other" as ExpenseCategory, description: "", paid_to: "", amount: "",
  currency: "USD" as FinanceCurrency, method: "", reference: "",
});

const ExpensesSection = () => {
  const year = new Date().getFullYear();
  const { data: expenses = [], isLoading, error } = useExpenses();
  const { data: summary } = useIncomeExpenseSummary(year);
  const create = useCreateExpense();
  const remove = useDeleteExpense();
  const [form, setForm] = useState(emptyForm);
  const set = (key: keyof ReturnType<typeof emptyForm>, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await create.mutateAsync({ ...form, paid_to: form.paid_to.trim(), description: form.description.trim() });
      toast.success("Expense recorded");
      setForm(emptyForm());
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const currencies = FINANCE_CURRENCIES.map((item) => item.value).filter((code) => summary?.totals[code]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold">Expenses &amp; Income</h2>
        <p className="text-sm text-muted-foreground">Record what the school spends and see it against the fees received in {year}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {currencies.length === 0 && <p className="text-sm text-muted-foreground md:col-span-2">No payments or expenses have been recorded for {year} yet.</p>}
        {currencies.map((code) => {
          const totals = summary!.totals[code]!;
          const net = Number(totals.net);
          return (
            <Card key={code}>
              <CardHeader className="pb-2"><CardTitle className="text-base">{code === "USD" ? "US dollars" : "Zimbabwe Gold"}, {year}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-muted-foreground">Fees received</p><p className="font-semibold text-emerald-700">{formatMoney(totals.income, code)}</p></div>
                <div><p className="text-muted-foreground">Spent</p><p className="font-semibold text-rose-700">{formatMoney(totals.expenses, code)}</p></div>
                <div><p className="text-muted-foreground">{net < 0 ? "Shortfall" : "Surplus"}</p><p className={`font-semibold ${net < 0 ? "text-rose-700" : "text-foreground"}`}>{formatMoney(Math.abs(net), code)}</p></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {summary && summary.months.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Month by month</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="py-2 pr-4 font-medium">Month</th><th className="py-2 pr-4 font-medium">Currency</th><th className="py-2 pr-4 text-right font-medium">Received</th><th className="py-2 pr-4 text-right font-medium">Spent</th><th className="py-2 text-right font-medium">Net</th></tr></thead>
              <tbody className="divide-y divide-border">
                {summary.months.flatMap((row) => Object.entries(row.currencies).map(([code, values]) => (
                  <tr key={`${row.month}-${code}`}>
                    <td className="py-2 pr-4">{formatSchoolDate(`${row.month}-01`, { month: "long", year: "numeric" })}</td>
                    <td className="py-2 pr-4">{code}</td>
                    <td className="py-2 pr-4 text-right">{formatMoney(values!.income, code as FinanceCurrency)}</td>
                    <td className="py-2 pr-4 text-right">{formatMoney(values!.expenses, code as FinanceCurrency)}</td>
                    <td className={`py-2 text-right font-medium ${Number(values!.net) < 0 ? "text-rose-700" : ""}`}>{formatMoney(values!.net, code as FinanceCurrency)}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Record an expense</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={(event) => void save(event)} className="grid gap-3 md:grid-cols-3">
            <label className="text-sm">Date<Input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} /></label>
            <label className="text-sm">Category
              <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.category} onChange={(e) => set("category", e.target.value)}>
                {EXPENSE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-sm md:col-span-1">What was it for?<Input required maxLength={255} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. ZESA electricity, March" /></label>
            <label className="text-sm">Amount<Input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} /></label>
            <label className="text-sm">Currency
              <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                {FINANCE_CURRENCIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-sm">Paid to<Input maxLength={128} value={form.paid_to} onChange={(e) => set("paid_to", e.target.value)} placeholder="Supplier or person" /></label>
            <label className="text-sm">Payment method<Input maxLength={32} value={form.method} onChange={(e) => set("method", e.target.value)} placeholder="Cash, bank transfer…" /></label>
            <label className="text-sm">Receipt or reference<Input maxLength={64} value={form.reference} onChange={(e) => set("reference", e.target.value)} /></label>
            <div className="flex items-end"><Button type="submit" disabled={create.isPending}>{create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Save expense</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recorded expenses</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? <p className="py-6 text-center text-muted-foreground">Loading expenses…</p>
            : error ? <p className="text-destructive">Could not load expenses: {getErrorMessage(error)}</p>
            : expenses.length === 0 ? <p className="py-6 text-center text-muted-foreground">No expenses yet. Record the first one above.</p>
            : (
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="py-2 pr-4 font-medium">Date</th><th className="py-2 pr-4 font-medium">Details</th><th className="py-2 pr-4 font-medium">Category</th><th className="py-2 pr-4 text-right font-medium">Amount</th><th className="py-2" /></tr></thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-2 pr-4">{formatSchoolDate(item.date)}</td>
                      <td className="py-2 pr-4"><p>{item.description}</p><p className="text-xs text-muted-foreground">{[item.paid_to, item.method, item.reference].filter(Boolean).join(" · ") || `Recorded by ${item.recorded_by || "unknown"}`}</p></td>
                      <td className="py-2 pr-4">{item.category_label}</td>
                      <td className="py-2 pr-4 text-right font-medium">{formatMoney(item.amount, item.currency)}</td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm" variant="ghost" aria-label={`Delete ${item.description}`} disabled={remove.isPending}
                          onClick={() => { if (window.confirm(`Delete "${item.description}"? This cannot be undone.`)) void remove.mutateAsync(item.id).then(() => toast.success("Expense deleted")).catch((err) => toast.error(getErrorMessage(err))); }}
                        ><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesSection;
