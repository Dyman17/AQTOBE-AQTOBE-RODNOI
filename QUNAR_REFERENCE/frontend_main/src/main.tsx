import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { I18nProvider } from "@/context/I18nContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ThemeProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </ThemeProvider>
  </AuthProvider>
);
