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
  // Get the current page URL.
  const location = useLocation();

  // Identify pages that are accessible without logging in.
  const isPublicPage =
    location.pathname === "/" ||
    location.pathname === "/home" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  // Display the appropriate navbar and page routes.
  return (
    <>
      {/* Show the public navbar or logged-in navbar. */}
      {isPublicPage ? <AuthNavbar /> : <Navbar />}

      {/* Define all application routes. */}
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Pages */}
        {/* Only authenticated users can access the dashboard. */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Only authenticated users can access collection requests. */}
        <Route
          path="/collection-requests"
          element={
            <ProtectedRoute>
              <CollectionRequests />
            </ProtectedRoute>
          }
        />

        {/* Only authenticated users can access their profile. */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown URLs to the home page. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Display the website copyright footer. */}
      <footer className="app-footer">
        <p>© 2026 KITARO. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;