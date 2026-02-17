import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, Gift, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const walletCards = [
  { title: "Main Balance", value: "0 RWF", icon: Wallet, color: "gradient-primary" },
  { title: "Bonus Balance", value: "1,000 RWF", icon: Gift, color: "gradient-gold" },
  { title: "Total Earnings", value: "0 RWF", icon: TrendingUp, color: "gradient-primary" },
  { title: "Withdrawable", value: "0 RWF", icon: ArrowUpCircle, color: "gradient-primary" },
];

const recentActivity = [
  { type: "Welcome Bonus", amount: "+1,000 RWF", date: "Today", status: "Credited" },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your investment overview.</p>
        </div>

        {/* Wallet cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {walletCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{card.title}</span>
                    <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center`}>
                      <card.icon className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-card-foreground">{card.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/dashboard/deposit">
            <Card className="shadow-card hover:shadow-card-hover transition-all cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowDownCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">Deposit Funds</p>
                  <p className="text-xs text-muted-foreground">MTN or Airtel Money</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/dashboard/marketplace">
            <Card className="shadow-card hover:shadow-card-hover transition-all cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg gradient-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">Buy Products</p>
                  <p className="text-xs text-muted-foreground">Activate earning contracts</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/dashboard/withdraw">
            <Card className="shadow-card hover:shadow-card-hover transition-all cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">Withdraw</p>
                  <p className="text-xs text-muted-foreground">Min 1,000 RWF</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Member level */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Your Member Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-full gradient-gold text-accent-foreground text-sm font-semibold">
                Starter Member
              </div>
              <p className="text-sm text-muted-foreground">
                Purchase limit: 1 product. Upgrade by increasing your investment activity.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{item.type}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">{item.amount}</p>
                  <p className="text-xs text-muted-foreground">{item.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
