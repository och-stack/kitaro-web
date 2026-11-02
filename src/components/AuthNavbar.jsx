
import { NavLink, Link } from "react-router-dom";
import { House, LogIn, UserRoundPlus } from "lucide-react";

function AuthNavbar() {
    return (
        <nav className="navbar kitaro-navbar">
            <div className="container">
                <Link className="navbar-brand kitaro-brand" to="/">
                    KITARO
                </Link>

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
