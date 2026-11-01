
import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import {
    LayoutDashboard,
    ClipboardList,
    UserRound,
    LogOut,
} from "lucide-react";

function Navbar() {
    const [session, setSession] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <nav className="navbar kitaro-navbar">
            <div className="container">
                <Link className="navbar-brand kitaro-brand" to="/dashboard">
                    KITARO
                </Link>

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

                        <NavLink
                            to="/login"
                            className="kitaro-nav-link"
                            onClick={async (event) => {
                                event.preventDefault();

                                const { error } = await supabase.auth.signOut();

                                if (error) {
                                    console.error("Logout error:", error.message);
                                    return;
                                }

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
