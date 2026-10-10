import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Search, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type ContactMessage = { id: number; name: string; email: string; phone: string; subject: string; message: string; created_at: string };
const rows = (value: ContactMessage[] | { results?: ContactMessage[] }) => Array.isArray(value) ? value : value.results ?? [];
const path = "/content/contact-messages/";

const MessageSection = () => {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-contact-messages"], queryFn: async () => rows(await api.get<ContactMessage[] | { results?: ContactMessage[] }>(path)) });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`${path}${id}/`), onSuccess: () => { void client.invalidateQueries({ queryKey: ["admin-contact-messages"] }); toast.success("Message deleted"); }, onError: e => toast.error(getErrorMessage(e)) });
  const filtered = useMemo(() => data.filter(m => `${m.name} ${m.email} ${m.subject} ${m.message}`.toLowerCase().includes(search.toLowerCase())), [data, search]);
  return <div className="space-y-5"><div><h2 className="font-heading text-xl font-bold">Contact Inbox</h2><p className="text-sm text-muted-foreground">Website enquiries submitted to Able God College</p></div><div className="relative max-w-lg"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-10" placeholder="Search messages" value={search} onChange={e=>setSearch(e.target.value)}/></div>{isLoading?<p className="py-10 text-center text-muted-foreground">Loading inbox…</p>:error?<p className="rounded-xl border border-destructive/30 p-5 text-destructive">Could not load the inbox: {getErrorMessage(error)}</p>:filtered.length===0?<Card><CardContent className="p-10 text-center text-muted-foreground">No contact messages have been received.</CardContent></Card>:<div className="space-y-3">{filtered.map(m=><Card key={m.id}><CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row"><div className="min-w-0"><div className="flex items-center gap-2"><User className="h-4 w-4 text-primary"/><h3 className="font-semibold">{m.name}</h3></div><p className="mt-1 text-sm font-medium">{m.subject}</p><p className="my-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p><p className="text-xs text-muted-foreground">Received {new Date(m.created_at).toLocaleString()}</p><div className="mt-2 flex flex-wrap gap-3 text-sm"><a className="text-primary hover:underline" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}><Mail className="mr-1 inline h-3 w-3"/>{m.email}</a>{m.phone&&<a className="text-primary hover:underline" href={`tel:${m.phone}`}><Phone className="mr-1 inline h-3 w-3"/>{m.phone}</a>}</div></div><Button variant="outline" size="icon" aria-label="Delete contact message" onClick={()=>window.confirm("Delete this enquiry?")&&remove.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></CardContent></Card>)}</div>}</div>;
};
export default MessageSection;
