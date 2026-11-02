
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import AuthNavbar from "./components/AuthNavbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CollectionRequests from "./pages/CollectionRequests";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";

function App() {
  const location = useLocation();

  const isPublicPage =
    location.pathname === "/" ||
    location.pathname === "/home" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <>
      {isPublicPage ? <AuthNavbar /> : <Navbar />}

      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/collection-requests"
          element={
            <ProtectedRoute>
              <CollectionRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Unknown URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
