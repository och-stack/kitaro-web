import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import supabase from "../supabaseClient";

// Protect routes from users who are not logged in.
function ProtectedRoute({ children }) {
    // Track loading status and authentication status.
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const location = useLocation();

    // Check the current login session and listen for authentication changes.
    useEffect(() => {
        async function checkLogin() {
            const { data, error } = await supabase.auth.getSession();

            // Update authentication status based on the session.
            setIsAuthenticated(!error && Boolean(data.session));
            setLoading(false);
        }

        checkLogin();

        // Listen for login and logout events.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(Boolean(session));
            setLoading(false);
        });

        // Remove the listener when the component unmounts.
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Show a loading message while checking the session.
    if (loading) {
        return <p>Checking login...</p>;
    }

    // Redirect unauthenticated users to the login page.
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        );
    }

    // Allow authenticated users to access the protected page.
    return children;
}

export default ProtectedRoute;