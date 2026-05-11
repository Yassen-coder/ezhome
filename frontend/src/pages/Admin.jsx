import { useEffect, useState } from "react";
import { api, setAdminToken } from "../lib/api";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

const EMPTY_FORM = {
  title: "", description: "", short_description: "", image_url: "",
  category: "smart-home", source: "amazon", affiliate_url: "",
  original_price: 0, discounted_price: 0, rating: 4.5, review_count: 0,
  badges: "", is_trending: false, is_best_seller: false, is_daily_deal: false,
};

const Admin = () => {
  const [token, setToken] = useState(() => localStorage.getItem("ezhome-admin-token") || "");
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (token) {
      setAdminToken(token);
      loadAll();
    }
  }, [token]);

  const loadAll = async () => {
    try {
      const [s, p] = await Promise.all([api.get("/admin/stats"), api.get("/products", { params: { limit: 200 } })]);
      setStats(s.data);
      setProducts(p.data);
    } catch (e) {
      if (e.response?.status === 401) logout();
    }
  };

  const login = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post("/admin/login", { password });
      setToken(r.data.token);
      localStorage.setItem("ezhome-admin-token", r.data.token);
      toast.success("Logged in");
    } catch {
      toast.error("Wrong password");
    }
  };

  const logout = () => {
    setToken("");
    setAdminToken(null);
    localStorage.removeItem("ezhome-admin-token");
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        original_price: parseFloat(form.original_price),
        discounted_price: parseFloat(form.discounted_price),
        rating: parseFloat(form.rating),
        review_count: parseInt(form.review_count, 10),
        badges: form.badges ? form.badges.split(",").map((s) => s.trim()).filter(Boolean) : [],
      };
      await api.post("/products", payload);
      toast.success("Product created");
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    toast.success("Deleted");
    loadAll();
  };

  if (!token) {
    return (
      <div className="container-px mx-auto max-w-md py-24" data-testid="admin-login">
        <p className="overline text-muted-foreground mb-3">Restricted</p>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-8">Admin Sign In</h1>
        <form onSubmit={login} className="space-y-4">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full px-4 py-3 bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
            data-testid="admin-password-input"
          />
          <button type="submit" className="w-full px-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors" data-testid="admin-login-button">
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container-px mx-auto max-w-[1400px] py-16" data-testid="admin-dashboard">
      <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
        <div>
          <p className="overline text-muted-foreground mb-2">Dashboard</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Admin Panel</h1>
        </div>
        <button onClick={logout} className="text-xs uppercase tracking-[0.18em] border border-border px-4 py-2 hover:border-foreground" data-testid="admin-logout">Sign out</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Products", value: stats.total_products },
            { label: "Clicks", value: stats.total_clicks },
            { label: "Subscribers", value: stats.total_subscribers },
            { label: "Messages", value: stats.total_messages },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border p-6">
              <p className="overline text-muted-foreground">{s.label}</p>
              <p className="font-display text-4xl font-bold mt-2">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Products ({products.length})</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid="admin-add-product"
        >
          <Plus className="w-4 h-4" /> {showForm ? "Cancel" : "Add product"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-secondary border border-border p-6 mb-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm" data-testid="form-title" />
          <input required placeholder="Short description" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm" />
          <textarea required placeholder="Full description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm sm:col-span-2" rows={2} />
          <input required placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm sm:col-span-2" />
          <input required placeholder="Affiliate URL" value={form.affiliate_url} onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm sm:col-span-2" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm">
            {["smart-home", "kitchen", "decor", "organization", "tiktok", "fashion"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm">
            {["amazon", "temu", "shein"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="number" step="0.01" placeholder="Original price" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm" />
          <input type="number" step="0.01" placeholder="Discounted price" value={form.discounted_price} onChange={(e) => setForm({ ...form, discounted_price: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm" />
          <input type="number" step="0.1" placeholder="Rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm" />
          <input type="number" placeholder="Reviews" value={form.review_count} onChange={(e) => setForm({ ...form, review_count: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm" />
          <input placeholder="Badges (comma separated)" value={form.badges} onChange={(e) => setForm({ ...form, badges: e.target.value })} className="px-3 py-2 bg-background border border-border text-sm sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_trending} onChange={(e) => setForm({ ...form, is_trending: e.target.checked })} /> Trending</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} /> Best Seller</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_daily_deal} onChange={(e) => setForm({ ...form, is_daily_deal: e.target.checked })} /> Daily Deal</label>
          <button type="submit" className="sm:col-span-2 px-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors" data-testid="form-submit">Create Product</button>
        </form>
      )}

      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left p-4 overline text-muted-foreground">Image</th>
              <th className="text-left p-4 overline text-muted-foreground">Title</th>
              <th className="text-left p-4 overline text-muted-foreground">Cat</th>
              <th className="text-left p-4 overline text-muted-foreground">Price</th>
              <th className="text-left p-4 overline text-muted-foreground">Clicks</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border" data-testid={`admin-row-${p.id}`}>
                <td className="p-3"><img src={p.image_url} alt="" className="w-12 h-12 object-cover" /></td>
                <td className="p-3 max-w-[300px] truncate">{p.title}</td>
                <td className="p-3 text-muted-foreground">{p.category}</td>
                <td className="p-3">${p.discounted_price}</td>
                <td className="p-3">{p.click_count}</td>
                <td className="p-3 text-right">
                  <button onClick={() => remove(p.id)} className="p-2 hover:text-destructive" data-testid={`delete-${p.id}`}><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
