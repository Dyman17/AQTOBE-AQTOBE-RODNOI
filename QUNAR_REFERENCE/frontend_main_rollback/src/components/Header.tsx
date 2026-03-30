import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useI18n } from "@/context/I18nContext";

const navLinks = [
  { to: "/dashboard", labelKey: "common.dashboard" },
  { to: "/subscriptions", labelKey: "common.subscriptions" },
  { to: "/farms", labelKey: "common.farms" },
  { to: "/plants", labelKey: "common.plants" },
  { to: "/sensors", labelKey: "common.sensors" },
  { to: "/settings", labelKey: "common.settings" },
];

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl text-primary">
          <Leaf className="w-7 h-7" />
          Qunar
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border px-1 py-1 text-xs">
            {(["en", "ru", "kk"] as const).map((lang) => (
              <button
                key={lang}
                className={`px-2 py-1 rounded-full transition-colors ${
                  language === lang ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setLanguage(lang)}
                aria-label={t("header.language")}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("header.themeToggle")}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {!user && (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">{t("common.login")}</Link>
              </Button>
              <Button asChild>
                <Link to="/register">{t("common.register")}</Link>
              </Button>
            </>
          )}
          {user && (
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> {t("common.logout")}
            </Button>
          )}
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-md">
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
              <div className="flex items-center gap-1 rounded-full border px-1 py-1 text-xs">
                {(["en", "ru", "kk"] as const).map((lang) => (
                  <button
                    key={lang}
                    className={`px-2 py-1 rounded-full transition-colors ${
                      language === lang ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setLanguage(lang)}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("header.themeToggle")}>
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2 mt-3">
              {!user && (
                <>
                  <Button variant="ghost" asChild className="flex-1">
                    <Link to="/login" onClick={() => setMobileOpen(false)}>{t("common.login")}</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/register" onClick={() => setMobileOpen(false)}>{t("common.register")}</Link>
                  </Button>
                </>
              )}
              {user && (
                <Button variant="outline" className="flex-1" onClick={logout}>
                  {t("common.logout")}
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
