import { useEffect, useState } from "react";
import { api, formatApiError } from "../../lib/api";
import { toast } from "sonner";
import { useSettings } from "../../lib/settings";

import { Save } from "lucide-react";

const Settings = () => {
  const { refetchSettings } = useSettings();
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/settings").then((r) => {
      setSettings(r.data);
      setForm(r.data);
    });
  }, []);

  if (!form) return <p className="text-muted-foreground">Loading…</p>;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const patch = {
        announcement_text: form.announcement_text,
        hero_overline: form.hero_overline,
        hero_eyebrow_enabled: form.hero_eyebrow_enabled,
        newsletter_enabled: form.newsletter_enabled,
        countdown_enabled: form.countdown_enabled,
      };
      const { data } = await api.patch("/settings", patch);
      setSettings(data);
      setForm(data);
      await refetchSettings();
      toast.success("Settings saved");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="admin-settings-page" className="max-w-3xl">
      <div className="mb-8">
        <p className="overline text-muted-foreground mb-2">Configuration</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Site Settings</h1>
        <p className="text-sm text-muted-foreground mt-2">Manage homepage content and toggle features without redeploying.</p>
      </div>

      <form onSubmit={save} className="bg-background border border-border p-6 sm:p-8 space-y-6">
        <div>
          <label className="overline text-muted-foreground">Announcement bar text</label>
          <input
            value={form.announcement_text || ""}
            onChange={(e) => setForm({ ...form, announcement_text: e.target.value })}
            className="mt-2 w-full px-4 py-3 bg-secondary border border-border text-sm"
            data-testid="settings-announcement"
          />
          <p className="text-xs text-muted-foreground mt-1.5">Shown above the navbar on every page.</p>
        </div>

        <div>
          <label className="overline text-muted-foreground">Hero overline</label>
          <input
            value={form.hero_overline || ""}
            onChange={(e) => setForm({ ...form, hero_overline: e.target.value })}
            className="mt-2 w-full px-4 py-3 bg-secondary border border-border text-sm"
            data-testid="settings-hero-overline"
          />
          <p className="text-xs text-muted-foreground mt-1.5">Eyebrow line above the main hero headline.</p>
        </div>

        <div className="border-t border-border pt-6 space-y-3">
          <p className="overline text-muted-foreground">Feature toggles</p>
          <SwitchRow label="Show eyebrow / sparkle line on hero" value={form.hero_eyebrow_enabled} onChange={(v) => setForm({ ...form, hero_eyebrow_enabled: v })} testId="toggle-eyebrow" />
          <SwitchRow label="Newsletter signup popup" value={form.newsletter_enabled} onChange={(v) => setForm({ ...form, newsletter_enabled: v })} testId="toggle-newsletter" />
          <SwitchRow label="Daily deals countdown section" value={form.countdown_enabled} onChange={(v) => setForm({ ...form, countdown_enabled: v })} testId="toggle-countdown" />
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50" data-testid="settings-save">
            <Save className="w-4 h-4" /> {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
      {settings?.updated_at && (
        <p className="text-xs text-muted-foreground mt-4">Last updated {new Date(settings.updated_at).toLocaleString()}</p>
      )}
    </div>
  );
};

const SwitchRow = ({ label, value, onChange, testId }) => (
  <label className="flex items-center justify-between gap-4 cursor-pointer text-sm py-2" data-testid={testId}>
    <span>{label}</span>
    <span
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className={`relative inline-block w-11 h-6 rounded-full transition-colors ${value ? "bg-foreground" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform ${value ? "translate-x-5" : ""}`} />
    </span>
  </label>
);

export default Settings;
