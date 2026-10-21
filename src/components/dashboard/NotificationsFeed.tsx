import { Bell, CalendarDays, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/api";
import { useNotices } from "@/lib/hooks";

const NotificationsFeed = ({ title = "Notifications" }: { title?: string }) => {
  const { data: notices = [], isLoading, error } = useNotices();
  const visibleNotices = notices.filter((notice) => notice.status === "approved").slice(0, 5);

  return (
    <Card id="notifications-feed" className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><Bell className="h-5 w-5 text-primary" />{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <p className="py-4 text-center text-sm text-muted-foreground">Loading notifications…</p>
          : error ? <p className="text-sm text-destructive">Could not load notifications: {getErrorMessage(error)}</p>
            : visibleNotices.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No approved notifications for you yet.</p>
              : visibleNotices.map((notice) => (
                <article key={notice.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="flex min-w-0 items-center gap-2 font-semibold text-foreground"><Megaphone className="h-4 w-4 shrink-0 text-accent" />{notice.title}</h3>
                    {notice.priority === "High" && <Badge variant="destructive">Important</Badge>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{notice.content}</p>
                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{new Date(notice.date).toLocaleDateString()} · {notice.author}</p>
                </article>
              ))}
      </CardContent>
    </Card>
  );
};

export default NotificationsFeed;
