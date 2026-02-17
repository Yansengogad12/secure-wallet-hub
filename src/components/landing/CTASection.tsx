import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Start <span className="text-gradient-gold">Earning?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join today and receive a 1,000 RWF welcome bonus. No hidden fees,
            transparent earnings, secure platform.
          </p>
          <Link to="/register">
            <Button variant="gold" size="xl">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-6">
            For educational & demonstration purposes only. Terms apply.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
