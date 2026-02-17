import { motion } from "framer-motion";

const stats = [
  { value: "5%", label: "Daily Returns" },
  { value: "50", label: "Days Contract" },
  { value: "6K", label: "Min Deposit (RWF)" },
  { value: "1K", label: "Welcome Bonus (RWF)" },
];

const StatsSection = () => {
  return (
    <section className="py-16 gradient-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-primary-foreground/70 text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
