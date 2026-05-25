import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CATEGORY_SLUGS } from "../../lib/categories";
import { getProductImages } from "../../lib/productImages";

const CATEGORIES = CATEGORY_SLUGS;
const SOURCES = ["amazon", "temu", "shein"];

const empty = {
  title: "",
  description: "",
  short_description: "",
  image_url: "",
  image_urls: [],
  video_url: "",
  category: "smart-home",
  source: "amazon",
  affiliate_url: "",
  original_price: 0,
  discounted_price: 0,
  rating: 4.5,
  review_count: 0,
  badges: "",
  is_trending: false,
  is_best_seller: false,
  is_daily_deal: false,
};

const ProductForm = ({ initial, onSubmit, onCancel, submitLabel = "Save" }) => {
  const [form, setForm] = useState(empty);
  const [imageUrls, setImageUrls] = useState([""]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) {
      const imgs = getProductImages(initial);
      setForm({
        ...empty,
        ...initial,
        video_url: initial.video_url || "",
        badges: Array.isArray(initial.badges)
          ? initial.badges.join(", ")
          : initial.badges || "",
      });
      setImageUrls(imgs.length > 0 ? imgs : [""]);
    } else {
      setForm(empty);
      setImageUrls([""]);
    }
  }, [initial]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addImageField = () => setImageUrls((urls) => [...urls, ""]);

  const removeImageField = (index) => {
    setImageUrls((urls) => {
      if (urls.length <= 1) return [""];
      return urls.filter((_, i) => i !== index);
    });
  };

  const updateImageUrl = (index, value) => {
    setImageUrls((urls) => urls.map((u, i) => (i === index ? value : u)));
  };

  const submit = async (e) => {
    e.preventDefault();
    const urls = imageUrls.map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        ...form,
        image_url: urls[0],
        image_urls: urls,
        secondary_image_url: urls[1] || null,
        video_url: form.video_url?.trim() || null,
        original_price: parseFloat(form.original_price) || 0,
        discounted_price: parseFloat(form.discounted_price) || 0,
        rating: parseFloat(form.rating) || 0,
        review_count: parseInt(form.review_count || 0, 10),
        badges: form.badges
          ? String(form.badges)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="product-form">
      <Field label="Title" required>
        <input
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className={inputCls}
          data-testid="form-title"
        />
      </Field>
      <Field label="Short description" required>
        <input
          required
          value={form.short_description}
          onChange={(e) => update("short_description", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Description" full>
        <textarea
          required
          rows={2}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Field label="Product images" full required>
        <div className="space-y-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                required={index === 0}
                type="url"
                value={url}
                onChange={(e) => updateImageUrl(index, e.target.value)}
                placeholder={index === 0 ? "Main image URL (required)" : "Additional image URL"}
                className={`${inputCls} flex-1`}
                data-testid={index === 0 ? "form-image-main" : `form-image-${index}`}
              />
              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="p-2.5 border border-border hover:border-destructive hover:text-destructive transition-colors shrink-0"
                  aria-label="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImageField}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-border hover:border-foreground transition-colors w-full sm:w-auto justify-center"
            data-testid="form-add-image"
          >
            <Plus className="w-4 h-4" /> Add another image
          </button>
          <p className="text-[11px] text-muted-foreground">
            First image is the main photo. Extra images appear in the product slider.
          </p>
        </div>
      </Field>

      <Field label="Product video (optional)" full>
        <input
          type="url"
          value={form.video_url || ""}
          onChange={(e) => update("video_url", e.target.value)}
          placeholder="YouTube, Vimeo, or direct .mp4 link — shown on landing page"
          className={inputCls}
          data-testid="form-video-url"
        />
      </Field>

      <Field label="Affiliate URL" full required>
        <input
          required
          type="url"
          value={form.affiliate_url}
          onChange={(e) => update("affiliate_url", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Category">
        <select
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          className={inputCls}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Source">
        <select
          value={form.source}
          onChange={(e) => update("source", e.target.value)}
          className={inputCls}
        >
          {SOURCES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Original price ($)">
        <input
          type="number"
          step="0.01"
          value={form.original_price}
          onChange={(e) => update("original_price", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Discounted price ($)">
        <input
          type="number"
          step="0.01"
          value={form.discounted_price}
          onChange={(e) => update("discounted_price", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Rating">
        <input
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={form.rating}
          onChange={(e) => update("rating", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Review count">
        <input
          type="number"
          value={form.review_count}
          onChange={(e) => update("review_count", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Tags / Badges (comma separated)" full>
        <input
          value={form.badges}
          onChange={(e) => update("badges", e.target.value)}
          placeholder="e.g. BEST SELLER, VIRAL"
          className={inputCls}
        />
      </Field>
      <p className="sm:col-span-2 text-[11px] text-muted-foreground -mb-2">
        Timed offers are managed under Admin → Flash Deals (multiple products, start/end, on/off).
      </p>
      <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2">
        <Toggle
          label="Featured / Best Seller"
          value={form.is_best_seller}
          onChange={(v) => update("is_best_seller", v)}
          testId="toggle-best-seller"
        />
        <Toggle
          label="Trending"
          value={form.is_trending}
          onChange={(v) => update("is_trending", v)}
          testId="toggle-trending"
        />
        <Toggle
          label="Legacy daily flag"
          value={form.is_daily_deal}
          onChange={(v) => update("is_daily_deal", v)}
          testId="toggle-daily-deal"
        />
      </div>
      <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 text-sm border border-border hover:border-foreground transition-colors"
            data-testid="form-cancel"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-3 bg-foreground text-background text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          data-testid="form-submit"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

const inputCls =
  "w-full px-3 py-2.5 bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 rounded-md";

const Field = ({ label, children, full, required }) => (
  <label className={`flex flex-col gap-2 ${full ? "sm:col-span-2" : ""}`}>
    <span className="overline text-muted-foreground">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
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
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${value ? "translate-x-4" : ""}`}
      />
    </span>
    {label}
  </label>
);

export default ProductForm;
