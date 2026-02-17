import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const Withdraw = () => {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const numAmount = Number(amount) || 0;
  const fee = numAmount * 0.1;
  const netAmount = numAmount - fee;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount < 1000) {
      toast({
        title: "Invalid amount",
        description: "Minimum withdrawal is 1,000 RWF.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Withdrawal requires backend",
      description: "Enable Lovable Cloud to process withdrawals.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Withdraw Funds</h1>
          <p className="text-muted-foreground">Transfer earnings to your mobile money.</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (RWF)</Label>
                <Input
                  type="number"
                  placeholder="Min 1,000 RWF"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {numAmount >= 1000 && (
                <div className="p-4 rounded-lg bg-muted space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground font-medium">{numAmount.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee (10%)</span>
                    <span className="text-destructive font-medium">-{fee.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-foreground font-semibold">You receive</span>
                    <span className="text-success font-bold">{netAmount.toLocaleString()} RWF</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Withdrawal method must be verified via OTP. Minimum: 1,000 RWF.
              </p>

              <Button type="submit" variant="hero" className="w-full" size="lg">
                Request Withdrawal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Withdraw;
