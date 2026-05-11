import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ImageIcon, Settings as SettingsIcon, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "../../lib/auth";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon },
  { to: "/admin/settings", label: "Site Settings", icon: SettingsIcon },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col lg:flex-row" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className="lg:w-64 lg:min-h-screen border-r border-border bg-background flex flex-col">
        <div className="px-6 py-6 border-b border-border">
          <p className="overline text-muted-foreground text-[10px]">EzHome</p>
          <h1 className="font-display text-xl font-black tracking-tight mt-1">Admin Console</h1>
        </div>
        <nav className="flex-1 p-4 flex lg:flex-col gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                }`
              }
              data-testid={`admin-nav-${item.label.toLowerCase().replace(/ /g, "-")}`}
            >
              <item.icon className="w-4 h-4" strokeWidth={1.5} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:block p-4 border-t border-border">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs overline text-muted-foreground hover:text-foreground mb-4"
            data-testid="admin-view-site"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View live site
          </a>
          {user && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium truncate" data-testid="admin-user-email">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-border text-xs uppercase tracking-[0.18em] hover:border-foreground transition-colors"
            data-testid="admin-logout-button"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-5 sm:p-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
