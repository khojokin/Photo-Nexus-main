import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Check, X, ExternalLink, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface Report {
  id: number;
  photoId: number;
  reporterName: string;
  reason: string;
  body: string | null;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  resolved: "bg-green-500/10 text-green-400 border-green-500/30",
  dismissed: "bg-muted/50 text-muted-foreground border-border",
};

export function Admin() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { reports: Report[] }) => setReports(d.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      }
    } finally { setUpdating(null); }
  }

  if (!user) {
    return (
      <Layout>
        <div className="py-32 text-center text-muted-foreground">
          <Shield className="w-10 h-10 mx-auto mb-4 opacity-30" />
          <p className="font-serif text-xl">Sign in to access admin tools.</p>
        </div>
      </Layout>
    );
  }

  const pending = reports.filter((r) => r.status === "pending");
  const reviewed = reports.filter((r) => r.status !== "pending");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="flex items-center gap-3 mb-10">
          <Shield className="w-6 h-6 text-muted-foreground" />
          <div>
            <h1 className="text-4xl font-serif">Moderation</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Review reported content and take action</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
        ) : reports.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border text-muted-foreground">
            <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No reports yet. The community is well-behaved!</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xs uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Pending ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map((r) => <ReportCard key={r.id} report={r} updating={updating} onUpdate={updateStatus} />)}
                </div>
              </div>
            )}
            {reviewed.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Reviewed ({reviewed.length})</h2>
                <div className="space-y-3 opacity-60">
                  {reviewed.map((r) => <ReportCard key={r.id} report={r} updating={updating} onUpdate={updateStatus} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function ReportCard({ report, updating, onUpdate }: { report: Report; updating: number | null; onUpdate: (id: number, status: string) => void }) {
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className={cn("text-xs px-2 py-0.5 border", STATUS_COLORS[report.status] ?? STATUS_COLORS.pending)}>
              {report.status}
            </span>
            <span className="text-xs text-muted-foreground font-medium">{report.reason}</span>
            <span className="text-xs text-muted-foreground">{format(new Date(report.createdAt), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/photos/${report.photoId}`}
              className="text-sm flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors">
              <ExternalLink className="w-3 h-3" /> Photo #{report.photoId}
            </Link>
            <span className="text-xs text-muted-foreground">reported by {report.reporterName}</span>
          </div>
          {report.body && <p className="text-sm text-muted-foreground italic">"{report.body}"</p>}
        </div>

        {report.status === "pending" && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onUpdate(report.id, "resolved")} disabled={updating === report.id}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-40">
              <Check className="w-3 h-3" /> Resolve
            </button>
            <button onClick={() => onUpdate(report.id, "dismissed")} disabled={updating === report.id}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40">
              <X className="w-3 h-3" /> Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
