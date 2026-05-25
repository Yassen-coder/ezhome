import { useEffect, useState } from "react";
import { api, formatApiError } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Flame } from "lucide-react";

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value) => {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
};

const STATUS_STYLES = {
  live: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-blue-100 text-blue-800",
  ended: "bg-neutral-200 text-neutral-600",
  draft: "bg-amber-100 text-amber-900",
};

const emptyForm = () => ({
  title: "Limited Time Offers",
  subtitle: "Premium pieces at unbeatable prices.",
  product_ids: [],
  starts_at: toLocalInput(new Date().toISOString()),
  ends_at: toLocalInput(
    new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
  ),
  is_enabled: true,
});

const FlashDeals = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [dealsRes, productsRes] = await Promise.all([
        api.get("/flash-deals"),
        api.get("/products", { params: { limit: 200 } }),
      ]);
      setCampaigns(dealsRes.data || []);
      setAllProducts(productsRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing("new");
    setForm(emptyForm());
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({
      title: c.title,
      subtitle: c.subtitle || "",
      product_ids: [...(c.product_ids || [])],
      starts_at: toLocalInput(c.starts_at),
      ends_at: toLocalInput(c.ends_at),
      is_enabled: c.is_enabled !== false,
    });
  };

  const toggleProduct = (id) => {
    setForm((f) => ({
      ...f,
      product_ids: f.product_ids.includes(id)
        ? f.product_ids.filter((x) => x !== id)
        : [...f.product_ids, id],
    }));
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (form.product_ids.length === 0) {
      toast.error("Select at least one product");
      return;
    }
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      product_ids: form.product_ids,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
      is_enabled: form.is_enabled,
    };
    try {
      if (editing === "new") {
        await api.post("/flash-deals", payload);
        toast.success("Campaign created");
      } else {
        await api.patch(`/flash-deals/${editing}`, payload);
        toast.success("Campaign updated");
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this campaign?")) return;
    try {
      await api.delete(`/flash-deals/${id}`);
      toast.success("Campaign deleted");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const filteredProducts = allProducts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div data-testid="admin-flash-deals-page">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="overline text-muted-foreground mb-2 flex items-center gap-2">
            <Flame className="w-3.5 h-3.5" /> Promotions
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Flash Deals
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Schedule limited-time offers with multiple products. When the timer ends,
            the campaign disappears from the site but stays here as ended (you can delete it).
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background text-sm font-semibold"
          data-testid="flash-deal-new"
        >
          <Plus className="w-4 h-4" /> New campaign
        </button>
      </div>

      {editing && (
        <div className="border border-border bg-card p-6 mb-8" data-testid="flash-deal-form">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg font-bold">
              {editing === "new" ? "Create campaign" : "Edit campaign"}
            </h2>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="overline text-muted-foreground text-[10px]">Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={inputCls}
                data-testid="flash-deal-title"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="overline text-muted-foreground text-[10px]">Subtitle</span>
              <input
                value={form.subtitle}
                onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="overline text-muted-foreground text-[10px]">Starts</span>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="overline text-muted-foreground text-[10px]">Ends</span>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                className={inputCls}
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-3 mt-4 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={form.is_enabled}
              onChange={(e) => setForm((f) => ({ ...f, is_enabled: e.target.checked }))}
              data-testid="flash-deal-enabled"
            />
            Published (visible on site when within schedule)
          </label>

          <div className="mt-6">
            <p className="overline text-muted-foreground text-[10px] mb-2">
              Products ({form.product_ids.length} selected)
            </p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className={`${inputCls} mb-3 max-w-md`}
            />
            <div className="max-h-48 overflow-y-auto border border-border divide-y divide-border">
              {filteredProducts.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.product_ids.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <img src={p.image_url} alt="" className="w-8 h-8 object-cover rounded" />
                  <span className="line-clamp-1 flex-1">{p.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-5 py-2 border border-border text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="px-6 py-2 bg-foreground text-background text-sm font-semibold"
              data-testid="flash-deal-save"
            >
              Save campaign
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : campaigns.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8">
          No campaigns yet. Create one to run timed offers on the homepage and Deals page.
        </p>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="border border-border bg-background p-5 flex flex-wrap gap-4 justify-between"
              data-testid={`flash-deal-row-${c.id}`}
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold">{c.title}</h3>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_STYLES[c.status] || STATUS_STYLES.draft}`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{c.subtitle}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {c.product_ids?.length || 0} products ·{" "}
                  {new Date(c.starts_at).toLocaleString()} → {new Date(c.ends_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="p-2 border border-border hover:border-foreground"
                  aria-label="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="p-2 border border-border hover:border-destructive hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const inputCls =
  "w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30";

export default FlashDeals;
