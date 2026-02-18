import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", color: "bg-warning" },
  { id: "airtel", name: "Airtel Money", color: "bg-destructive" },
];

const Withdraw = () => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const numAmount = Number(amount) || 0;
  const fee = numAmount * 0.1;
  const netAmount = numAmount - fee;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount < 1000) {
      toast({ title: "Invalid amount", description: "Minimum withdrawal is 1,000 RWF.", variant: "destructive" });
      return;
    }
    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 10) {
      toast({ title: "Invalid phone", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("create_withdrawal", {
        p_amount: numAmount,
        p_phone: trimmedPhone,
        p_payment_method: method,
      });
      if (error) throw error;
      const result = data as any;
      toast({
        title: result.success ? "Withdrawal Submitted!" : "Withdrawal Failed",
        description: result.message || result.error,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        setAmount("");
        setPhone("");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
            <CardTitle className="text-lg">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
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

            <form onSubmit={handleWithdraw} className="space-y-4">
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
                Funds will be sent to your {method === "mtn" ? "MTN Mobile Money" : "Airtel Money"} number. Minimum: 1,000 RWF.
              </p>

              <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Processing..." : "Request Withdrawal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Withdraw;
