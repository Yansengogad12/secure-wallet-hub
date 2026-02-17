import { motion } from "framer-motion";
import { ShoppingBag, TrendingUp, Wallet, Shield, Clock, Users } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Easy Deposits",
    description: "Deposit via MTN Mobile Money or Airtel Money starting from 6,000 RWF.",
  },
  {
    icon: ShoppingBag,
    title: "Product Marketplace",
    description: "Browse agricultural products, livestock, digital services and more.",
  },
  {
    icon: TrendingUp,
    title: "5% Daily Returns",
    description: "Earn 5% daily on your product investments for 50 days.",
  },
  {
    icon: Clock,
    title: "Auto Earnings",
    description: "Earnings are credited automatically every 24 hours to your wallet.",
  },
  {
    icon: Shield,
    title: "Secure Withdrawals",
    description: "OTP-verified withdrawal methods with MTN and Airtel Money.",
  },
  {
    icon: Users,
    title: "Member Levels",
    description: "Progress from Starter to VIP and unlock more product purchases.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start earning in three simple steps: deposit, purchase, and earn daily.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="group p-6 rounded-xl bg-card shadow-card hover:shadow-card-hover transition-all duration-300 border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
