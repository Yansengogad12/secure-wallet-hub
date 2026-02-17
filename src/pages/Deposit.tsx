import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", color: "bg-warning" },
  { id: "airtel", name: "Airtel Money", color: "bg-destructive" },
];

const Deposit = () => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mtn");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (numAmount < 6000 || numAmount > 5000000) {
      toast({
        title: "Invalid amount",
        description: "Deposit must be between 6,000 and 5,000,000 RWF.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Deposit requires backend",
      description: "Enable Lovable Cloud to process deposits.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deposit Funds</h1>
          <p className="text-muted-foreground">Add money to your wallet via mobile money.</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    method === pm.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${pm.color} mb-2`} />
                  <p className="text-sm font-medium text-card-foreground">{pm.name}</p>
                </button>
              ))}
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+250 7XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (RWF)</Label>
                <Input
                  type="number"
                  placeholder="Min 6,000 — Max 5,000,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: 6,000 RWF · Maximum: 5,000,000 RWF
                </p>
              </div>
              <Button type="submit" variant="hero" className="w-full" size="lg">
                Deposit Now
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Deposit;
