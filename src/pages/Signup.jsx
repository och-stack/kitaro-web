
import { Link } from "react-router-dom";

function Signup() {
    function handleSubmit(event) {
        event.preventDefault();
        // Connect to the account creation API later.
    }

    return (
        <main className="auth-page">
            <div className="auth-card">
                <p className="auth-eyebrow">MAKE EVERY RESOURCE COUNT</p>

                <h1>Create your account</h1>

                <p className="auth-description">
                    Track waste, monitor records, and discover opportunities to recycle responsibly.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input
                            id="displayName"
                            name="displayName"
                            type="text"
                            className="form-control"
                            placeholder="Display name"
                            autoComplete="name"
                            aria-label="Display name"
                            required
                        />
                    </div>

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
                            placeholder="Create a password (8 characters minimum)"
                            autoComplete="new-password"
                            aria-label="Create a password"
                            minLength={8}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-kitaro w-100">
                        Create Account
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </main>
    );
}

export default Signup;
