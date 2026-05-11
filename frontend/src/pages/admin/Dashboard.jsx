import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, MousePointerClick, Mail, MessageSquare, TrendingUp } from "lucide-react";
import { api } from "../../lib/api";

const StatCard = ({ icon: Icon, label, value, testId }) => (
  <div className="bg-background border border-border p-6" data-testid={testId}>
    <div className="flex items-start justify-between">
      <Icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
    </div>
    <p className="overline text-muted-foreground mt-6">{label}</p>
    <p className="font-display text-4xl font-black tracking-tight mt-2">{value ?? "—"}</p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="admin-dashboard-page">
      <div className="mb-10">
        <p className="overline text-muted-foreground mb-2">Overview</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-2">Real-time stats across your EzHome storefront.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Products" value={stats?.total_products} testId="stat-products" />
        <StatCard icon={MousePointerClick} label="Affiliate Clicks" value={stats?.total_clicks} testId="stat-clicks" />
        <StatCard icon={Mail} label="Subscribers" value={stats?.total_subscribers} testId="stat-subscribers" />
        <StatCard icon={MessageSquare} label="Messages" value={stats?.total_messages} testId="stat-messages" />
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" /> Top performing products
          </h2>
          <Link to="/admin/products" className="text-sm underline-offset-4 hover:underline">View all →</Link>
        </div>
        <div className="bg-background border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="text-left p-4 overline text-muted-foreground">Product</th>
                <th className="text-right p-4 overline text-muted-foreground">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.top_products || []).slice(0, 8).map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0" data-testid={`top-product-${p.id}`}>
                  <td className="p-4 max-w-[400px] truncate">{p.title}</td>
                  <td className="p-4 text-right font-medium">{p.click_count}</td>
                </tr>
              ))}
              {(!stats || stats.top_products.length === 0) && (
                <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">No click data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
