
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        const formData = new FormData(event.currentTarget);

        const email = formData.get("email");
        const password = formData.get("password");

        try {
            const apiUrl = import.meta.env.VITE_API_URL.replace(/\/$/, "");

            const response = await fetch(`${apiUrl}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to log in");
            }

            const { error: sessionError } = await supabase.auth.setSession({
                access_token: result.access_token,
                refresh_token: result.refresh_token,
            });

            if (sessionError) {
                throw sessionError;
            }

            navigate("/dashboard");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        setError("");

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });

        if (error) {
            setError(error.message);
        }
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

                    {error && (
                        <p className="text-danger" role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="btn btn-kitaro w-100"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <div className="my-3 text-center">OR</div>

                <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={handleGoogleLogin}
                >
                    Continue with Google
                </button>

                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </main>
    );
}

export default Login;
