import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "../lib/api";
import { useSettings } from "../lib/settings";
import { toast } from "sonner";

const NewsletterPopup = () => {
  const { newsletter_enabled } = useSettings();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!newsletter_enabled) return;
    if (window.location.pathname !== "/") return;
    if (localStorage.getItem("ezhome-newsletter-dismissed")) return;
    if (sessionStorage.getItem("ezhome-newsletter-shown")) return;
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem("ezhome-newsletter-shown", "1");
    }, 14000);
    return () => clearTimeout(t);
  }, [newsletter_enabled]);

  const close = () => {
    setOpen(false);
    localStorage.setItem("ezhome-newsletter-dismissed", "1");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/newsletter", { email });
      setSubmitted(true);
      toast.success("Welcome to EzHome — check your inbox!");
      setTimeout(close, 2200);
    } catch (err) {
      toast.error("Please enter a valid email");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm fade-up" data-testid="newsletter-popup">
      <div className="relative w-full max-w-lg bg-background border border-border shadow-2xl overflow-hidden">
        <button onClick={close} className="absolute top-4 right-4 z-10 p-2 hover:opacity-60" aria-label="Close" data-testid="newsletter-close">
          <X className="w-4 h-4" />
        </button>
        <div className="aspect-[16/9] bg-muted overflow-hidden">
          <img src="https://images.unsplash.com/photo-1757262798620-c2cc40cfb440?w=800&q=85" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="p-8 sm:p-10">
          <p className="overline text-muted-foreground mb-3">Join the Club</p>
          <h3 className="font-display text-2xl sm:text-3xl font-bold leading-tight">Be the first to know!</h3>
          <p className="mt-3 text-sm text-muted-foreground">Weekly curated drops, viral deals, and members-only finds — straight to your inbox.</p>
          {submitted ? (
            <p className="mt-6 font-medium text-accent">You're in. Welcome to EzHome.</p>
          ) : (
            <form onSubmit={submit} className="mt-6 flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
                data-testid="newsletter-email-input"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-foreground text-background text-sm font-medium tracking-wide hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                data-testid="newsletter-submit-button"
              >
                {loading ? "..." : "Subscribe Now"}
              </button>
            </form>
          )}
          <p className="mt-4 text-[10px] text-muted-foreground tracking-wide">By subscribing you agree to our Privacy Policy. Unsubscribe anytime.</p>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPopup;
