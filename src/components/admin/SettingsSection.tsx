import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Health = { status: string; backend: string; database: string };
const SettingsSection = ({ activeSubNav }: { activeSubNav: string }) => {
  const client = useQueryClient();
  const health = useQuery({ queryKey: ["system-health"], queryFn: () => api.get<Health>("/health/"), refetchInterval: 30000, retry: 1 });
  const clearCache = () => { client.clear(); toast.success("Application data cache cleared from this browser"); };
  if (activeSubNav === "cache") return <div className="space-y-5"><div><h2 className="font-heading text-xl font-bold">Browser Data Cache</h2><p className="text-sm text-muted-foreground">Clear cached API results held by this app. Your account and saved school records are not deleted.</p></div><Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6"><div className="flex items-center gap-3"><RefreshCw className="h-6 w-6 text-primary"/><div><p className="font-semibold">Clear cached queries</p><p className="text-sm text-muted-foreground">The next page visit will reload current data from the server.</p></div></div><Button variant="gold" onClick={clearCache}>Clear Cache</Button></CardContent></Card></div>;
  return <div className="space-y-5"><div><h2 className="font-heading text-xl font-bold">System Setup</h2><p className="text-sm text-muted-foreground">Live service status for the Able God College application</p></div><div className="grid gap-4 md:grid-cols-3">{[{ label:"Application API", value:health.data?.backend, icon:Server },{ label:"Database", value:health.data?.database, icon:Database },{ label:"Overall status", value:health.data?.status, icon:ShieldCheck }].map(item=><Card key={item.label}><CardContent className="flex items-center gap-3 p-5"><item.icon className="h-6 w-6 text-primary"/><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="font-semibold capitalize">{health.isLoading?"Checking…":health.error?"Unavailable":item.value}</p></div></CardContent></Card>)}</div>{health.error&&<p className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Health check failed: {getErrorMessage(health.error)}</p>}<Button variant="outline" onClick={()=>void health.refetch()} disabled={health.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${health.isFetching?"animate-spin":""}`}/>Check again</Button><p className="text-xs text-muted-foreground">Email delivery credentials and production secrets are managed by the server environment and are not stored in the browser.</p></div>;
};
export default SettingsSection;
