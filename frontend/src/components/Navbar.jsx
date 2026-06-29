import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Moon, Sun, Menu, X, ShoppingBag } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useSettings } from "../lib/settings";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Input } from "./ui/input";
import CurrencySelector from "./CurrencySelector";
import { NAV_CATEGORY_LINKS } from "../lib/categories";

const Navbar = () => {
  const { theme, toggle } = useTheme();
  const { announcement_text, settingsLoading } = useSettings();
  const [openSearch, setOpenSearch] = useState(false);
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/products?search=${encodeURIComponent(q)}`);
      setOpenSearch(false);
      setMobileOpen(false);
      setQ("");
    }
  };

  return (
    <>
      {/* Announcement bar — hidden until settings load to prevent value flash */}
      {!settingsLoading && (
        <div
          className="bg-foreground text-background text-[10px] sm:text-sm py-2 text-center font-medium tracking-wider px-4"
          data-testid="announcement-bar"
        >
          {announcement_text}
        </div>
      )}

      <header
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border"
        data-testid="navbar"
      >
        <nav className="container-px mx-auto flex items-center justify-between h-16 sm:h-20 max-w-[1400px]">
          {/* Mobile menu */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  data-testid="mobile-menu-button"
                  className="p-2 -ml-2"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-background overflow-y-auto">
                <div className="flex flex-col gap-1 pt-8">
                  {NAV_CATEGORY_LINKS.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setMobileOpen(false)}
                      className="py-3 text-lg font-display font-medium hover:opacity-60 transition-opacity"
                      data-testid={`mobile-nav-${l.to.replace(/\//g, "-")}`}
                    >
                      {l.label}
                    </Link>
                  ))}
                  <div className="h-px bg-border my-4" />
                  <Link
                    to="/about"
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-sm overline opacity-70"
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-sm overline opacity-70"
                  >
                    Contact
                  </Link>
                  <div className="h-px bg-border my-4" />
                  {/* Currency selector in mobile */}
                  <CurrencySelector mobile={true} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <ShoppingBag className="w-5 h-5 hidden sm:block" strokeWidth={1.5} />
            <span className="font-display font-black text-2xl sm:text-3xl tracking-tight">
              EzHome<span className="text-accent">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_CATEGORY_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-medium hover:opacity-60 transition-opacity"
                data-testid={`nav-${l.to.replace(/\//g, "-")}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Currency selector — desktop only */}
            <div className="hidden lg:block">
              <CurrencySelector />
            </div>

            <button
              onClick={() => setOpenSearch((v) => !v)}
              className="p-2 hover:opacity-60 transition-opacity"
              aria-label="Search"
              data-testid="search-toggle-button"
            >
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <button
              onClick={toggle}
              className="p-2 hover:opacity-60 transition-opacity"
              aria-label="Toggle theme"
              data-testid="theme-toggle-button"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Moon className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </nav>

        {/* Search drawer */}
        {openSearch && (
          <div
            className="border-t border-border bg-background/95 backdrop-blur-xl"
            data-testid="search-drawer"
          >
            <form
              onSubmit={submit}
              className="container-px mx-auto max-w-[1400px] py-5 flex items-center gap-3"
            >
              <Search className="w-5 h-5 opacity-60" strokeWidth={1.5} />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, brands, ideas..."
                className="border-0 bg-transparent text-base focus-visible:ring-0 px-0"
                data-testid="search-input"
              />
              <button
                onClick={() => setOpenSearch(false)}
                type="button"
                aria-label="Close search"
              >
                <X className="w-5 h-5 opacity-60" />
              </button>
            </form>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
