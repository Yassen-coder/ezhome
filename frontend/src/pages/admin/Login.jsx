import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, ShoppingBag } from "lucide-react";
import { useAuth } from "../../lib/auth";

const AdminLogin = () => {
  const { user, login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(email, password);
    setBusy(false);
    if (ok) nav("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4" data-testid="admin-login-page">
      <div className="w-full max-w-md bg-background border border-border p-8 sm:p-10">
        <div className="flex items-center gap-2 mb-8">
          <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
          <span className="font-display font-black text-xl tracking-tight">EzHome<span className="text-accent">.</span></span>
        </div>
        <p className="overline text-muted-foreground mb-3 flex items-center gap-2">
          <Lock className="w-3 h-3" /> Restricted
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          Admin Sign In
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to manage products, banners, and site settings.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="overline text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ezhome.shop"
              className="mt-2 w-full px-4 py-3 bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
              data-testid="admin-email-input"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="overline text-muted-foreground">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full px-4 py-3 bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
              data-testid="admin-password-input"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" data-testid="admin-login-error">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full px-6 py-3.5 bg-foreground text-background text-sm font-semibold tracking-wide hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            data-testid="admin-login-button"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-[10px] text-muted-foreground tracking-wide text-center">
          Secured by JWT · Rate-limited
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
