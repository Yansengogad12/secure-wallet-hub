import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminWithdrawals = () => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: withs } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
    setWithdrawals(withs || []);

    if (withs && withs.length > 0) {
      const userIds = [...new Set(withs.map(w => w.user_id))];
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);
      const profMap: Record<string, any> = {};
      profs?.forEach(p => { profMap[p.user_id] = p; });
      setProfiles(profMap);
    }
    setLoading(false);
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing(id);
    const fn = action === "approve" ? "admin_approve_withdrawal" : "admin_reject_withdrawal";
    const { data } = await supabase.rpc(fn as any, { p_withdrawal_id: id });
    const result = data as any;
    if (result?.success) {
      toast({ title: action === "approve" ? "Withdrawal Approved" : "Withdrawal Rejected", description: result.message });
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

  const renderWithdrawals = (filtered: any[]) => (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No withdrawals found.</p>
      ) : filtered.map((w) => {
        const profile = profiles[w.user_id];
        return (
          <Card key={w.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{Number(w.amount).toLocaleString()} RWF</span>
                    <Badge variant={statusColor(w.status)}>{w.status}</Badge>
                    <Badge variant="outline">{w.payment_method?.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fee: {Number(w.fee).toLocaleString()} RWF · Net: <strong>{Number(w.net_amount).toLocaleString()} RWF</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">{profile?.full_name || "Unknown"} · Phone: {w.phone}</p>
                  <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</p>
                </div>
                {w.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm" variant="default"
                      disabled={processing === w.id}
                      onClick={() => handleAction(w.id, "approve")}
                      className="gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </Button>
                    <Button
                      size="sm" variant="destructive"
                      disabled={processing === w.id}
                      onClick={() => handleAction(w.id, "reject")}
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
          <h1 className="text-2xl font-bold text-foreground">Withdrawals</h1>
          <p className="text-muted-foreground">Review and approve withdrawal requests</p>
        </div>

        {loading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Card key={i}><CardContent className="p-4"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({withdrawals.filter(w => w.status === "pending").length})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">{renderWithdrawals(withdrawals.filter(w => w.status === "pending"))}</TabsContent>
            <TabsContent value="approved" className="mt-4">{renderWithdrawals(withdrawals.filter(w => w.status === "approved"))}</TabsContent>
            <TabsContent value="rejected" className="mt-4">{renderWithdrawals(withdrawals.filter(w => w.status === "rejected"))}</TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
