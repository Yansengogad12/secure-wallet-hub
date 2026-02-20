import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminDeposits = () => {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: deps } = await supabase.from("deposits").select("*").order("created_at", { ascending: false });
    setDeposits(deps || []);

    if (deps && deps.length > 0) {
      const userIds = [...new Set(deps.map(d => d.user_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email, phone").in("user_id", userIds);
      const profMap: Record<string, any> = {};
      profs?.forEach(p => { profMap[p.user_id] = p; });
      setProfiles(profMap);
    }
    setLoading(false);
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing(id);
    const fn = action === "approve" ? "admin_approve_deposit" : "admin_reject_deposit";
    const { data } = await supabase.rpc(fn as any, { p_deposit_id: id });
    const result = data as any;
    if (result?.success) {
      toast({ title: action === "approve" ? "Deposit Approved" : "Deposit Rejected", description: result.message });
      fetchAll();
    } else {
      toast({ title: "Error", description: result?.error || "Action failed", variant: "destructive" });
    }
    setProcessing(null);
  };

  const statusColor = (status: string) => {
    if (status === "approved") return "default";
    if (status === "rejected") return "destructive";
    return "secondary";
  };

  const renderDeposits = (filtered: any[]) => (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No deposits found.</p>
      ) : filtered.map((d) => {
        const profile = profiles[d.user_id];
        return (
          <Card key={d.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{Number(d.amount).toLocaleString()} RWF</span>
                    <Badge variant={statusColor(d.status)}>{d.status}</Badge>
                    <Badge variant="outline">{d.payment_method?.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{profile?.full_name || "Unknown"} · {profile?.email}</p>
                  <p className="text-sm text-muted-foreground">Phone: {d.phone} · {new Date(d.created_at).toLocaleString()}</p>
                </div>
                {d.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant="default"
                      disabled={processing === d.id}
                      onClick={() => handleAction(d.id, "approve")}
                      className="gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                    <Button
                      size="sm" variant="destructive"
                      disabled={processing === d.id}
                      onClick={() => handleAction(d.id, "reject")}
                      className="gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
          <p className="text-muted-foreground">Review and approve user deposit requests</p>
        </div>

        {loading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({deposits.filter(d => d.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">{renderDeposits(deposits.filter(d => d.status === "pending"))}</TabsContent>
            <TabsContent value="approved" className="mt-4">{renderDeposits(deposits.filter(d => d.status === "approved"))}</TabsContent>
            <TabsContent value="rejected" className="mt-4">{renderDeposits(deposits.filter(d => d.status === "rejected"))}</TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDeposits;
