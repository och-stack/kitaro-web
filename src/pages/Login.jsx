
import { Link } from "react-router-dom";

function Login() {
    function handleSubmit(event) {
        event.preventDefault();
        // Connect to the authentication API later.
    }

    return (
        <main className="auth-page">
            <div className="auth-card">
                <p className="auth-eyebrow">WELCOME BACK</p>

                <h1>Log in to KITARO</h1>

                <p className="auth-description">
                    Manage your waste records and make every resource count.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="form-control"
                            placeholder="Email address"
                            autoComplete="email"
                            aria-label="Email address"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="form-control"
                            placeholder="Password"
                            autoComplete="current-password"
                            aria-label="Password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-kitaro w-100">
                        Log In
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </main>
    );
}

export default Login;
