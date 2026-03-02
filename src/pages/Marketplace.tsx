import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, TrendingUp, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const formatRWF = (n: number) => n.toLocaleString("en-RW") + " RWF";

const Marketplace = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("products").select("*").eq("is_active", true).order("price");
      setProducts(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const handlePurchase = async (product: any) => {
    setLoadingId(product.id);
    try {
      const { data, error } = await supabase.rpc("purchase_product", {
        p_product_name: product.name,
        p_product_price: product.price,
        p_daily_return: product.daily_return,
        p_total_return: product.total_return,
      });
      if (error) throw error;
      const result = data as any;
      toast({
        title: result.success ? "Purchase Successful!" : "Purchase Failed",
        description: result.success ? result.message : result.error,
        variant: result.success ? "default" : "destructive",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground">Browse and purchase products to activate earning contracts.</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><div className="h-48 bg-muted animate-pulse rounded" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="shadow-card hover:shadow-card-hover transition-all overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{product.image}</span>
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                    </div>
                    <h3 className="font-semibold text-card-foreground mb-1">{product.name}</h3>
                    <p className="text-2xl font-bold text-foreground mb-3">{formatRWF(product.price)}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                        {formatRWF(product.daily_return)}/day
                      </span>
                      <span>50 days</span>
                    </div>
                    <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium mb-4">
                      Total return: {formatRWF(product.total_return)}
                    </div>
                    <Button variant="hero" className="w-full" disabled={loadingId === product.id} onClick={() => handlePurchase(product)}>
                      {loadingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                      {loadingId === product.id ? "Processing..." : "Purchase"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;
