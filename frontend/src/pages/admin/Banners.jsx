import { useEffect, useState } from "react";
import { api, formatApiError } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Eye, EyeOff } from "lucide-react";

const EMPTY = {
  title: "", subtitle: "", image_url: "", cta_text: "Shop Now",
  cta_link: "/products", position: "hero", order: 0, is_active: true,
};

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [editing, setEditing] = useState(null); // null | "new" | banner
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/banners").then((r) => setBanners(r.data));
  useEffect(() => { load(); }, []);

  const open = (b) => {
    setEditing(b || "new");
    setForm(b ? { ...EMPTY, ...b } : EMPTY);
  };
  const close = () => { setEditing(null); setForm(EMPTY); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing === "new") {
        await api.post("/banners", form);
        toast.success("Banner created");
      } else {
        await api.patch(`/banners/${editing.id}`, form);
        toast.success("Banner updated");
      }
      close();
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    await api.delete(`/banners/${id}`);
    toast.success("Deleted");
    load();
  };

  const toggleActive = async (b) => {
    await api.patch(`/banners/${b.id}`, { is_active: !b.is_active });
    load();
  };

  return (
    <div data-testid="admin-banners-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="overline text-muted-foreground mb-2">Promotions</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Banners</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Hero = homepage bento (order 0–4). Category = &quot;Categories that feel like you&quot; tiles (set CTA link to /category/slug).
          </p>
        </div>
        <button onClick={() => open(null)} className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors" data-testid="admin-add-banner">
          <Plus className="w-4 h-4" /> New banner
        </button>
      </div>

      {editing && (
        <form onSubmit={submit} className="bg-background border border-border p-6 sm:p-8 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="banner-form">
          <div className="sm:col-span-2 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">{editing === "new" ? "New banner" : "Edit banner"}</h2>
            <button type="button" onClick={close} aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
          <Field label="Title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={ic} /></Field>
          <Field label="Subtitle"><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={ic} /></Field>
          <Field label="Image URL" full><input required type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={ic} /></Field>
          <Field label="CTA text"><input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} className={ic} /></Field>
          <Field label="CTA link (path or URL)"><input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} className={ic} /></Field>
          <Field label="Position">
            <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={ic} data-testid="banner-position">
              <option value="hero">hero — homepage bento</option>
              <option value="category">category — mood grid</option>
            </select>
          </Field>
          <Field label="Order"><input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value || 0, 10) })} className={ic} /></Field>
          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (visible on site)
          </label>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={close} className="px-5 py-3 text-sm border border-border hover:border-foreground transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-3 bg-foreground text-background text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors" data-testid="banner-submit">
              {editing === "new" ? "Create" : "Save changes"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {banners.length === 0 && <p className="text-muted-foreground text-sm py-8">No banners yet. Create one to feature on the homepage.</p>}
        {banners.map((b) => (
          <article key={b.id} className="bg-background border border-border overflow-hidden flex flex-col sm:flex-row" data-testid={`banner-card-${b.id}`}>
            <div className="sm:w-48 h-32 sm:h-auto bg-muted shrink-0">
              <img src={b.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex-1 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="overline text-[10px] text-muted-foreground">{b.position} · order {b.order}</span>
                <span className={`overline text-[10px] ${b.is_active ? "text-accent" : "text-muted-foreground"}`}>
                  {b.is_active ? "ACTIVE" : "HIDDEN"}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg leading-tight">{b.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.subtitle}</p>
              <div className="mt-auto pt-3 flex items-center gap-1">
                <button onClick={() => toggleActive(b)} className="p-2 hover:bg-secondary" aria-label="Toggle" data-testid={`banner-toggle-${b.id}`}>
                  {b.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => open(b)} className="p-2 hover:bg-secondary" aria-label="Edit" data-testid={`banner-edit-${b.id}`}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(b.id)} className="p-2 hover:bg-secondary hover:text-destructive" aria-label="Delete" data-testid={`banner-delete-${b.id}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

const ic = "w-full px-3 py-2.5 bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30";
const Field = ({ label, children, full }) => (
  <label className={`flex flex-col gap-2 ${full ? "sm:col-span-2" : ""}`}>
    <span className="overline text-muted-foreground">{label}</span>
    {children}
  </label>
);

export default Banners;
