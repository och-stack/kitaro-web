import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import supabase from "../supabaseClient";

// Login page component.
function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect users to their previous page or dashboard after login.
    const redirectTo = location.state?.from?.pathname || "/dashboard";

    // Store error and loading states.
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Handle email and password login.
    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        // Get email and password from the login form.
        const formData = new FormData(event.currentTarget);

        const email = formData.get("email");
        const password = formData.get("password");

        try {
            // Get the backend API URL.
            const apiUrl = import.meta.env.VITE_API_URL.replace(/\/+$/, "");

            // Send login details to the backend.
            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            // Handle unsuccessful login.
            if (!response.ok) {
                throw new Error(result.message || "Unable to log in");
            }

            // Save the login session in Supabase.
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: result.access_token,
                refresh_token: result.refresh_token,
            });

            if (sessionError) {
                throw sessionError;
            }

            // Redirect after successful login.
            navigate(redirectTo, { replace: true });

        } catch (error) {
            // Display login error.
            setError(error.message);
        } finally {
            // Reset loading state.
            setLoading(false);
        }
    }

    // Handle Google login using Supabase OAuth.
    async function handleGoogleLogin() {
        setError("");

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                // Redirect to dashboard after Google authentication.
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });

        // Display Google login error.
        if (error) {
            setError(error.message);
        }
    }

    // Display login form.
    return (
        <main className="auth-page">
            <div className="auth-card">

                <p className="auth-eyebrow">WELCOME BACK</p>

                <h1>Log in to KITARO</h1>

                <p className="auth-description">
                    Manage your waste records and make every resource count.
                </p>

                {/* Google login button. */}
                <button
                    type="button"
                    className="btn btn-kitaro w-100"
                    onClick={handleGoogleLogin}
                >
                    Continue with Google
                </button>

                <div className="my-3 text-center">OR</div>

                {/* Email and password login form. */}
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

                    {/* Display login error messages. */}
                    {error && (
                        <p className="text-danger" role="alert">
                            {error}
                        </p>
                    )}

                    {/* Submit login details. */}
                    <button
                        type="submit"
                        className="btn btn-kitaro w-100"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                </form>

                {/* Link to registration page. */}
                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>

            </div>
        </main>
    );
}

// Export Login for use in other components.
export default Login;