import { useEffect, useState } from "react";

import { CATEGORY_SLUGS } from "../../lib/categories";

const CATEGORIES = CATEGORY_SLUGS;
const SOURCES = ["amazon", "temu", "shein"];

const empty = {
  title: "", description: "", short_description: "", image_url: "",
  secondary_image_url: "",
  category: "smart-home", source: "amazon", affiliate_url: "",
  original_price: 0, discounted_price: 0, rating: 4.5, review_count: 0,
  badges: "", is_trending: false, is_best_seller: false, is_daily_deal: false,
};

const ProductForm = ({ initial, onSubmit, onCancel, submitLabel = "Save" }) => {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        ...empty,
        ...initial,
        badges: Array.isArray(initial.badges) ? initial.badges.join(", ") : (initial.badges || ""),
      });
    } else {
      setForm(empty);
    }
  }, [initial]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        ...form,
        original_price: parseFloat(form.original_price) || 0,
        discounted_price: parseFloat(form.discounted_price) || 0,
        rating: parseFloat(form.rating) || 0,
        review_count: parseInt(form.review_count || 0, 10),
        badges: form.badges ? String(form.badges).split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="product-form">
      <Field label="Title" required>
        <input required value={form.title} onChange={(e) => update("title", e.target.value)} className={inputCls} data-testid="form-title" />
      </Field>
      <Field label="Short description" required>
        <input required value={form.short_description} onChange={(e) => update("short_description", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Description" full>
        <textarea required rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} className={`${inputCls} resize-none`} />
      </Field>
      <Field label="Image URL" full required>
        <input required type="url" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Second image URL (slider)" full>
        <input
          type="url"
          value={form.secondary_image_url || ""}
          onChange={(e) => update("secondary_image_url", e.target.value)}
          placeholder="Optional — enables image slider on product cards"
          className={inputCls}
          data-testid="form-secondary-image"
        />
      </Field>
      <Field label="Affiliate URL" full required>
        <input required type="url" value={form.affiliate_url} onChange={(e) => update("affiliate_url", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Category">
        <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputCls}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Source">
        <select value={form.source} onChange={(e) => update("source", e.target.value)} className={inputCls}>
          {SOURCES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Original price ($)">
        <input type="number" step="0.01" value={form.original_price} onChange={(e) => update("original_price", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Discounted price ($)">
        <input type="number" step="0.01" value={form.discounted_price} onChange={(e) => update("discounted_price", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Rating">
        <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => update("rating", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Review count">
        <input type="number" value={form.review_count} onChange={(e) => update("review_count", e.target.value)} className={inputCls} />
      </Field>
      <Field label="Tags / Badges (comma separated)" full>
        <input value={form.badges} onChange={(e) => update("badges", e.target.value)} placeholder="e.g. BEST SELLER, VIRAL" className={inputCls} />
      </Field>
      <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2">
        <Toggle label="Featured / Best Seller" value={form.is_best_seller} onChange={(v) => update("is_best_seller", v)} testId="toggle-best-seller" />
        <Toggle label="Trending" value={form.is_trending} onChange={(v) => update("is_trending", v)} testId="toggle-trending" />
        <Toggle label="Daily Deal" value={form.is_daily_deal} onChange={(v) => update("is_daily_deal", v)} testId="toggle-daily-deal" />
      </div>
      <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-3 text-sm border border-border hover:border-foreground transition-colors" data-testid="form-cancel">
            Cancel
          </button>
        )}
        <button type="submit" disabled={busy} className="px-6 py-3 bg-foreground text-background text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50" data-testid="form-submit">
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

const inputCls = "w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30";

const Field = ({ label, children, full, required }) => (
  <label className={`flex flex-col gap-2 ${full ? "sm:col-span-2" : ""}`}>
    <span className="overline text-muted-foreground">
      {label}{required && <span className="text-destructive ml-1">*</span>}
    </span>
    {children}
  </label>
);

const Toggle = ({ label, value, onChange, testId }) => (
  <label className="inline-flex items-center gap-3 cursor-pointer text-sm select-none" data-testid={testId}>
    <span
      className={`relative inline-block w-10 h-6 rounded-full transition-colors ${value ? "bg-foreground" : "bg-border"}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${value ? "translate-x-4" : ""}`} />
    </span>
    {label}
  </label>
);

export default ProductForm;
