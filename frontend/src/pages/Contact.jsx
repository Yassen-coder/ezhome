import { useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      toast.success("Message sent. We'll get back within 24h.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-px mx-auto max-w-[1100px] py-16 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12" data-testid="contact-page">
      <div>
        <p className="overline text-muted-foreground mb-3">Talk to us</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95]">
          Get in <span className="italic font-medium">touch.</span>
        </h1>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          Got a question, a product suggestion, or just want to say hi? We read every message and reply within 24 hours.
        </p>
        <div className="mt-10 space-y-4 text-sm">
          <div>
            <p className="overline text-muted-foreground">Email</p>
            <p className="mt-1">hello@ezhome.shop</p>
          </div>
          <div>
            <p className="overline text-muted-foreground">Press</p>
            <p className="mt-1">press@ezhome.shop</p>
          </div>
          <div>
            <p className="overline text-muted-foreground">Partnerships</p>
            <p className="mt-1">partners@ezhome.shop</p>
          </div>
        </div>
      </div>
      <form onSubmit={submit} className="bg-secondary p-8 sm:p-10 border border-border space-y-4">
        <div>
          <label className="overline text-muted-foreground">Your name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-2 w-full px-4 py-3 bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            data-testid="contact-name"
          />
        </div>
        <div>
          <label className="overline text-muted-foreground">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-2 w-full px-4 py-3 bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            data-testid="contact-email"
          />
        </div>
        <div>
          <label className="overline text-muted-foreground">Message</label>
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="mt-2 w-full px-4 py-3 bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
            data-testid="contact-message"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 bg-foreground text-background text-sm font-medium tracking-wide hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          data-testid="contact-submit"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default Contact;
