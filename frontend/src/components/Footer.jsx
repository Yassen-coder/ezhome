import { Link } from "react-router-dom";
import { Instagram, Music2, Youtube, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border mt-24" data-testid="footer">
      <div className="container-px mx-auto max-w-[1400px] py-16 sm:py-24 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <h3 className="font-display font-black text-3xl tracking-tight">
            EzHome<span className="text-accent">.</span>
          </h3>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
            Curated essentials from the world's best brands. Discover viral finds, premium home goods, and TikTok-famous gems — all in one place.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <a href="#" aria-label="Instagram" className="hover:opacity-60 transition-opacity"><Instagram className="w-5 h-5" strokeWidth={1.5} /></a>
            <a href="#" aria-label="TikTok" className="hover:opacity-60 transition-opacity"><Music2 className="w-5 h-5" strokeWidth={1.5} /></a>
            <a href="#" aria-label="YouTube" className="hover:opacity-60 transition-opacity"><Youtube className="w-5 h-5" strokeWidth={1.5} /></a>
            <a href="#" aria-label="Twitter" className="hover:opacity-60 transition-opacity"><Twitter className="w-5 h-5" strokeWidth={1.5} /></a>
          </div>
        </div>
        <div>
          <p className="overline mb-4">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/category/smart-home" className="hover:opacity-60">Smart Home</Link></li>
            <li><Link to="/category/kitchen" className="hover:opacity-60">Kitchen</Link></li>
            <li><Link to="/category/decor" className="hover:opacity-60">Home Decor</Link></li>
            <li><Link to="/category/organization" className="hover:opacity-60">Organization</Link></li>
            <li><Link to="/category/tiktok" className="hover:opacity-60">TikTok Finds</Link></li>
            <li><Link to="/category/fashion" className="hover:opacity-60">Fashion</Link></li>
          </ul>
        </div>
        <div>
          <p className="overline mb-4">Brand</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:opacity-60">About Us</Link></li>
            <li><Link to="/contact" className="hover:opacity-60">Contact</Link></li>
            <li><Link to="/deals" className="hover:opacity-60">Daily Deals</Link></li>
          </ul>
        </div>
        <div>
          <p className="overline mb-4">Legal</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className="hover:opacity-60">Privacy Policy</Link></li>
            <li><Link to="/affiliate-disclosure" className="hover:opacity-60">Affiliate Disclosure</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-px mx-auto max-w-[1400px] py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} EzHome. All rights reserved.</p>
          <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> hello@ezhome.shop</p>
          <p>As an Amazon Associate, EzHome earns from qualifying purchases.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
