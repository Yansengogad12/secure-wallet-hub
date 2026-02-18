import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, TrendingUp, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const products = [
  {
    id: 1,
    name: "Premium Potato Seeds",
    category: "Agricultural",
    price: 10000,
    dailyReturn: 500,
    totalReturn: 25000,
    image: "🥔",
  },
  {
    id: 2,
    name: "Organic Bean Stock",
    category: "Agricultural",
    price: 15000,
    dailyReturn: 750,
    totalReturn: 37500,
    image: "🫘",
  },
  {
    id: 3,
    name: "Layer Chickens (10 pcs)",
    category: "Livestock",
    price: 50000,
    dailyReturn: 2500,
    totalReturn: 125000,
    image: "🐔",
  },
  {
    id: 4,
    name: "Maize Flour Mill Share",
    category: "Small Business",
    price: 100000,
    dailyReturn: 5000,
    totalReturn: 250000,
    image: "🌽",
  },
  {
    id: 5,
    name: "Digital Equipment Bundle",
    category: "Digital Services",
    price: 200000,
    dailyReturn: 10000,
    totalReturn: 500000,
    image: "💻",
  },
  {
    id: 6,
    name: "Transport Motorcycle Share",
    category: "Transport",
    price: 500000,
    dailyReturn: 25000,
    totalReturn: 1250000,
    image: "🏍️",
  },
];

const formatRWF = (n: number) => n.toLocaleString("en-RW") + " RWF";

const Marketplace = () => {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handlePurchase = async (product: typeof products[0]) => {
    setLoadingId(product.id);
    try {
      const { data, error } = await supabase.rpc("purchase_product", {
        p_product_name: product.name,
        p_product_price: product.price,
        p_daily_return: product.dailyReturn,
        p_total_return: product.totalReturn,
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
          <p className="text-muted-foreground">
            Browse and purchase products to activate earning contracts.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="shadow-card hover:shadow-card-hover transition-all overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{product.image}</span>
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-card-foreground mb-1">
                    {product.name}
                  </h3>
                  <p className="text-2xl font-bold text-foreground mb-3">
                    {formatRWF(product.price)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                      {formatRWF(product.dailyReturn)}/day
                    </span>
                    <span>50 days</span>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium mb-4">
                    Total return: {formatRWF(product.totalReturn)}
                  </div>
                  <Button
                    variant="hero"
                    className="w-full"
                    disabled={loadingId === product.id}
                    onClick={() => handlePurchase(product)}
                  >
                    {loadingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                    {loadingId === product.id ? "Processing..." : "Purchase"}
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;
