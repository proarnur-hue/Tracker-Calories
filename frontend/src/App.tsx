import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DisclaimerModal } from "./components/DisclaimerBanner";
import { useThemeStore } from "./store/themeStore";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UploadPage } from "./pages/UploadPage";
import { ResultPage } from "./pages/ResultPage";
import { DiaryPage } from "./pages/DiaryPage";
import { StatsPage } from "./pages/StatsPage";
import { ProfilePage } from "./pages/ProfilePage";

const DISCLAIMER_SEEN_KEY = "calorie-tracker-disclaimer-seen";

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const [showDisclaimer, setShowDisclaimer] = useState(() => !localStorage.getItem(DISCLAIMER_SEEN_KEY));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const dismissDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_SEEN_KEY, "1");
    setShowDisclaimer(false);
  };

  return (
    <>
      {showDisclaimer && <DisclaimerModal onClose={dismissDisclaimer} />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/diary" replace />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/diary" replace />} />
      </Routes>
    </>
  );
}
