import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">InvestPro</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 InvestPro. For demonstration purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
