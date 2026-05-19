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
            <li><a href="/category/smart-home" className="hover:opacity-60">Smart Home</a></li>
            <li><a href="/category/kitchen" className="hover:opacity-60">Kitchen</a></li>
            <li><a href="/category/decor" className="hover:opacity-60">Home Decor</a></li>
            <li><a href="/category/organization" className="hover:opacity-60">Organization</a></li>
            <li><a href="/category/tiktok" className="hover:opacity-60">TikTok Finds</a></li>
            <li><a href="/category/fashion" className="hover:opacity-60">Fashion</a></li>
          </ul>
        </div>
        <div>
          <p className="overline mb-4">Brand</p>
          <ul className="space-y-2 text-sm">
            <li><a href="/about" className="hover:opacity-60">About Us</a></li>
            <li><a href="/contact" className="hover:opacity-60">Contact</a></li>
            <li><a href="/deals" className="hover:opacity-60">Daily Deals</a></li>
          </ul>
        </div>
        <div>
          <p className="overline mb-4">Legal</p>
          <ul className="space-y-2 text-sm">
            <li><a href="/privacy" className="hover:opacity-60">Privacy Policy</a></li>
            <li><a href="/affiliate-disclosure" className="hover:opacity-60">Affiliate Disclosure</a></li>
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
