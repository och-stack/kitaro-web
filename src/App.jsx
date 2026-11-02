import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import AuthNavbar from "./components/AuthNavbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CollectionRequests from "./pages/CollectionRequests";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";

function App() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/home" ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <>
      {isAuthPage ? <AuthNavbar /> : <Navbar />}

      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/collection-requests" element={<CollectionRequests />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;