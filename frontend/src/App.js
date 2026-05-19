import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider } from "./lib/auth";
import { SettingsProvider } from "./lib/settings";
import { CurrencyProvider } from "./lib/currencyContext";
import { Toaster } from "sonner";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NewsletterPopup from "./components/NewsletterPopup";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Category from "./pages/Category";
import Deals from "./pages/Deals";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import AffiliateDisclosure from "./pages/AffiliateDisclosure";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminBanners from "./pages/admin/Banners";
import AdminSettings from "./pages/admin/Settings";

// Public layout wraps public routes only — admin pages have their own chrome
const PublicShell = ({ children }) => (
  <>
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
    <NewsletterPopup />
  </>
);

const AppRoutes = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    );
  }

  return (
    <PublicShell>
      <Routes>
        <Route path="/"                    element={<Home />} />
        <Route path="/products"            element={<Products />} />
        <Route path="/category/:slug"      element={<Category />} />
        <Route path="/deals"               element={<Deals />} />
        <Route path="/about"               element={<About />} />
        <Route path="/contact"             element={<Contact />} />
        <Route path="/privacy"             element={<Privacy />} />
        <Route path="/affiliate-disclosure" element={<AffiliateDisclosure />} />
      </Routes>
    </PublicShell>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <CurrencyProvider>
            <BrowserRouter>
              <div className="App min-h-screen flex flex-col bg-background text-foreground">
                <AppRoutes />
                <Toaster position="bottom-right" richColors />
              </div>
            </BrowserRouter>
          </CurrencyProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
