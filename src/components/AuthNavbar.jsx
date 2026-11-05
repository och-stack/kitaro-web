import { NavLink, Link } from "react-router-dom";
import { House, LogIn, UserRoundPlus } from "lucide-react";

// Navigation bar for authentication pages.
function AuthNavbar() {
    return (
        <nav className="navbar kitaro-navbar">
            <div className="container">
                {/* KITARO brand logo links to the landing page. */}
                <Link className="navbar-brand kitaro-brand" to="/">
                    KITARO
                </Link>

                {/* Navigation links. */}
                <div className="kitaro-nav-links">
                    <NavLink to="/home" className="kitaro-nav-link">
                        <House size={18} />
                        Home
                    </NavLink>

                    <NavLink to="/login" className="kitaro-nav-link">
                        <LogIn size={18} />
                        Log In
                    </NavLink>

                    <NavLink to="/signup" className="kitaro-nav-link">
                        <UserRoundPlus size={18} />
                        Register
                    </NavLink>
                </div>
            </div>
        </nav>
    );
}

export default AuthNavbar;