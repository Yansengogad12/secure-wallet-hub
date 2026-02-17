import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Gift, TrendingUp, ArrowUpCircle } from "lucide-react";
import { motion } from "framer-motion";

const balances = [
  { title: "Main Balance", value: "0 RWF", icon: Wallet, description: "Available for purchases" },
  { title: "Bonus Balance", value: "1,000 RWF", icon: Gift, description: "Welcome bonus credited" },
  { title: "Total Earnings", value: "0 RWF", icon: TrendingUp, description: "From all contracts" },
  { title: "Withdrawable", value: "0 RWF", icon: ArrowUpCircle, description: "Ready to withdraw" },
];

const WalletPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <p className="text-muted-foreground">Manage your balances and view transaction history.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {balances.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                      <b.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">{b.title}</span>
                  </div>
                  <p className="text-2xl font-bold text-card-foreground">{b.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground text-sm">
              No transactions yet. Make your first deposit to get started.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WalletPage;
