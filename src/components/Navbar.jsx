
import { NavLink, Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="navbar kitaro-navbar">
            <div className="container">
                <Link className="navbar-brand kitaro-brand" to="/login">
                    KITARO
                </Link>

                <div className="kitaro-nav-links">
                    <NavLink to="/login" className="kitaro-nav-link">
                        Log In
                    </NavLink>

                    <NavLink to="/signup" className="kitaro-nav-link">
                        Register
                    </NavLink>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
