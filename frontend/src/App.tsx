
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Auth from "./Auth";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Workspaces from "./pages/Workspaces";
import AppLayout from "./layouts/AppLayout";
import SavedReports from "./pages/SavedReports";

import { useAuthStore } from "./stores/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import Papers from "./pages/Papers";
import Assistant from "./pages/Assistant";
import PaperComparison from "./pages/PaperComparison";
import ResearchGapExplorer from "./pages/ResearchGapExplorer";

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route
          path="/"
          element={
            token ? <Navigate to="/dashboard" replace /> : <LandingPage />
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            token ? <Navigate to="/dashboard" replace /> : <Auth />
          }
        />

        {/* Protected application */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/papers" element={<Papers />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/compare" element={<PaperComparison />} />
            <Route
              path="/research-gaps"
              element={<ResearchGapExplorer />}
            />
            <Route path="/reports" element={<SavedReports />} />
          </Route>
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
