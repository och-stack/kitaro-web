
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import supabase from "../supabaseClient";

function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const location = useLocation();

    useEffect(() => {
        async function checkLogin() {
            const { data, error } = await supabase.auth.getSession();

            setIsAuthenticated(!error && Boolean(data.session));
            setLoading(false);
        }

        checkLogin();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(Boolean(session));
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return <p>Checking login...</p>;
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;
