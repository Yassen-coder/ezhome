import { useEffect, useMemo, useState } from "react";
import { api, formatApiError } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Search, X } from "lucide-react";
import ProductForm from "../../components/admin/ProductForm";

const CATS = ["all", "smart-home", "kitchen", "decor", "organization", "tiktok", "fashion"];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState(null); // null | "new" | product
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", { params: { limit: 200 } });
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, search, cat]);

  const create = async (form) => {
    try {
      await api.post("/products", form);
      toast.success("Product created");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const update = async (form) => {
    try {
      await api.patch(`/products/${editing.id}`, form);
      toast.success("Product updated");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div data-testid="admin-products-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="overline text-muted-foreground mb-2">Catalog</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Products ({products.length})</h1>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid="admin-add-product"
        >
          <Plus className="w-4 h-4" /> Add product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-background border border-border p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-border">
          <Search className="w-4 h-4 opacity-60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
            data-testid="admin-search-input"
          />
          {search && <button onClick={() => setSearch("")}><X className="w-4 h-4 opacity-60" /></button>}
        </div>
        <div className="flex flex-wrap gap-1">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-2 text-[10px] uppercase tracking-[0.18em] border transition-colors ${
                cat === c ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
              }`}
              data-testid={`admin-filter-${c}`}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Form drawer */}
      {editing && (
        <div className="bg-background border border-border p-6 sm:p-8 mb-6" data-testid="admin-product-form-wrap">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold">{editing === "new" ? "New product" : "Edit product"}</h2>
            <button onClick={() => setEditing(null)} className="p-2" aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
          <ProductForm
            initial={editing === "new" ? null : editing}
            onSubmit={editing === "new" ? create : update}
            onCancel={() => setEditing(null)}
            submitLabel={editing === "new" ? "Create product" : "Save changes"}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="text-left p-4 overline text-muted-foreground w-16">Image</th>
              <th className="text-left p-4 overline text-muted-foreground">Title</th>
              <th className="text-left p-4 overline text-muted-foreground hidden md:table-cell">Cat</th>
              <th className="text-left p-4 overline text-muted-foreground hidden md:table-cell">Source</th>
              <th className="text-right p-4 overline text-muted-foreground">Price</th>
              <th className="text-right p-4 overline text-muted-foreground hidden lg:table-cell">Clicks</th>
              <th className="p-4 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No products match.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0" data-testid={`admin-product-row-${p.id}`}>
                <td className="p-3"><img src={p.image_url} alt="" loading="lazy" className="w-12 h-12 object-cover" /></td>
                <td className="p-3 max-w-[280px] truncate font-medium">{p.title}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell uppercase text-[10px] tracking-wider">{p.source}</td>
                <td className="p-3 text-right tabular-nums">${p.discounted_price.toFixed(2)}</td>
                <td className="p-3 text-right hidden lg:table-cell tabular-nums">{p.click_count}</td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(p)} className="p-2 hover:bg-secondary" data-testid={`edit-${p.id}`} aria-label="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(p.id)} className="p-2 hover:bg-secondary hover:text-destructive" data-testid={`delete-${p.id}`} aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
