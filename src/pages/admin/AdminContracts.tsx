import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminContracts = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: purchases } = await supabase
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });
    setContracts(purchases || []);

    if (purchases && purchases.length > 0) {
      const userIds = [...new Set(purchases.map(p => p.user_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      const profMap: Record<string, any> = {};
      profs?.forEach(p => { profMap[p.user_id] = p; });
      setProfiles(profMap);
    }
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contracts</h1>
          <p className="text-muted-foreground">{contracts.length} total investment contracts</p>
        </div>

        {loading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : (
          <div className="space-y-3">
            {contracts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No contracts found.</p>
            ) : contracts.map((c) => {
              const profile = profiles[c.user_id];
              const progress = c.total_return > 0 ? Math.round((c.earned_so_far / c.total_return) * 100) : 0;
              return (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{c.product_name}</span>
                          <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{profile?.full_name || "Unknown"} · {profile?.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Price: {Number(c.product_price).toLocaleString()} RWF · Daily: {Number(c.daily_return).toLocaleString()} RWF · Days left: {c.days_remaining}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Earned: {Number(c.earned_so_far).toLocaleString()} / {Number(c.total_return).toLocaleString()} RWF ({progress}%)
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContracts;
