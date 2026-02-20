import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowDownCircle, ArrowUpCircle, ShoppingBag, DollarSign, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingDepositsAmount: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    totalContracts: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    systemFees: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [usersRes, depositsRes, withdrawalsRes, contractsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("deposits").select("amount, status"),
      supabase.from("withdrawals").select("amount, fee, status"),
      supabase.from("purchases").select("id", { count: "exact", head: true }),
    ]);

    const deposits = depositsRes.data || [];
    const withdrawals = withdrawalsRes.data || [];

    const pendingDeps = deposits.filter(d => d.status === "pending");
    const pendingWiths = withdrawals.filter(w => w.status === "pending");
    const approvedDeps = deposits.filter(d => d.status === "approved");
    const approvedWiths = withdrawals.filter(w => w.status === "approved");

    setStats({
      totalUsers: usersRes.count || 0,
      pendingDeposits: pendingDeps.length,
      pendingDepositsAmount: pendingDeps.reduce((s, d) => s + Number(d.amount), 0),
      pendingWithdrawals: pendingWiths.length,
      pendingWithdrawalsAmount: pendingWiths.reduce((s, w) => s + Number(w.amount), 0),
      totalContracts: contractsRes.count || 0,
      totalDeposited: approvedDeps.reduce((s, d) => s + Number(d.amount), 0),
      totalWithdrawn: approvedWiths.reduce((s, w) => s + Number(w.amount), 0),
      systemFees: approvedWiths.reduce((s, w) => s + Number(w.fee), 0),
    });
    setLoading(false);
  };

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Pending Deposits", value: `${stats.pendingDeposits} (${stats.pendingDepositsAmount.toLocaleString()} RWF)`, icon: Clock, color: "text-yellow-600" },
    { label: "Pending Withdrawals", value: `${stats.pendingWithdrawals} (${stats.pendingWithdrawalsAmount.toLocaleString()} RWF)`, icon: Clock, color: "text-orange-500" },
    { label: "Active Contracts", value: stats.totalContracts, icon: ShoppingBag, color: "text-primary" },
    { label: "Total Deposited", value: `${stats.totalDeposited.toLocaleString()} RWF`, icon: ArrowDownCircle, color: "text-green-600" },
    { label: "Total Withdrawn", value: `${stats.totalWithdrawn.toLocaleString()} RWF`, icon: ArrowUpCircle, color: "text-destructive" },
    { label: "System Fees (10%)", value: `${stats.systemFees.toLocaleString()} RWF`, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-muted-foreground">Platform statistics and pending actions</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
                    </div>
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
