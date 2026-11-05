import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import {
    LayoutDashboard,
    ClipboardList,
    UserRound,
    LogOut,
} from "lucide-react";

// Navigation bar for logged-in users.
function Navbar() {
    // Store the current user session.
    const [session, setSession] = useState(null);
    const navigate = useNavigate();

    // Check the current session and listen for authentication changes.
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
        });

        // Listen for login and logout events.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        // Remove the listener when the component unmounts.
        return () => subscription.unsubscribe();
    }, []);

    return (
        <nav className="navbar kitaro-navbar">
            <div className="container">
                {/* KITARO brand logo links to the dashboard. */}
                <Link className="navbar-brand kitaro-brand" to="/dashboard">
                    KITARO
                </Link>

                {/* Display navigation links when a session exists. */}
                {session && (
                    <div className="kitaro-nav-links">
                        <NavLink to="/dashboard" className="kitaro-nav-link">
                            <LayoutDashboard size={18} />
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/collection-requests"
                            className="kitaro-nav-link"
                        >
                            <ClipboardList size={18} />
                            Collection Requests
                        </NavLink>

                        <NavLink to="/profile" className="kitaro-nav-link">
                            <UserRound size={18} />
                            Profile
                        </NavLink>

                        {/* Sign out the user and redirect to login. */}
                        <NavLink
                            to="/login"
                            className="kitaro-nav-link"
                            onClick={async (event) => {
                                event.preventDefault();

                                const { error } = await supabase.auth.signOut();

                                // Display an error if logout fails.
                                if (error) {
                                    console.error("Logout error:", error.message);
                                    return;
                                }

                                // Redirect to the login page.
                                navigate("/login");
                            }}
                        >
                            <LogOut size={18} />
                            Log Out
                        </NavLink>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;