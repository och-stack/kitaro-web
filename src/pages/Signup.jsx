
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

function Signup() {
    // Navigate between pages.
    const navigate = useNavigate();

    // Store form errors, success messages and loading state.
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Handle email and password registration.
    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setMessage("");

        // Get form values.
        const formData = new FormData(event.currentTarget);

        const display_name = formData.get("displayName").trim();
        const email = formData.get("email").trim().toLowerCase();
        const password = formData.get("password");
        const confirmPassword = formData.get("confirmPassword");
        const user_type = formData.get("userType");

        // Check whether both passwords match.
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        // Only allow resident or small_business.
        if (!["resident", "small_business"].includes(user_type)) {
            setError("Please select a valid account type.");
            return;
        }

        setLoading(true);

        try {
            // Get the backend API URL.
            const apiUrl = import.meta.env.VITE_API_URL.replace(/\/+$/, "");

            // Send registration details to the backend.
            const response = await fetch(`${apiUrl}/api/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    display_name,
                    email,
                    password,
                    user_type,
                }),
            });

            // Read the backend response.
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to create account");
            }

            // Display the registration success message.
            setMessage(
                "Account created successfully! Please log in to continue."
            );

            // Redirect to the login page after registration.
            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (error) {
            // Display registration errors.
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    // Handle Google registration.
    async function handleGoogleSignup() {
        setError("");

        // Start Google authentication through Supabase.
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
        // Registration page container.
        <main className="auth-page">
            <div className="auth-card">
                <p className="auth-eyebrow">MAKE EVERY RESOURCE COUNT</p>

                <h1>Create your account</h1>

                <p className="auth-description">
                    Track waste, monitor records, and discover opportunities to recycle responsibly.
                </p>

                {/* Google registration button. */}
                <button
                    type="button"
                    className="btn btn-kitaro w-100"
                    onClick={handleGoogleSignup}
                >
                    Continue with Google
                </button>

                <div className="my-3 text-center">OR</div>

                {/* Email registration form. */}
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
                            placeholder="Enter your email address (e.g. name@gmail.com)"
                            autoComplete="email"
                            aria-label="Email address"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <select
                            id="userType"
                            name="userType"
                            className="form-select"
                            aria-label="Account type"
                            defaultValue=""
                            required
                        >
                            <option value="" disabled>
                                Select account type
                            </option>
                            <option value="resident">Resident</option>
                            <option value="small_business">Small Business</option>
                        </select>
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

                    <div className="mb-3">
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className="form-control"
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                            aria-label="Confirm your password"
                            minLength={8}
                            required
                        />
                    </div>

                    {/* Display registration errors. */}
                    {error && (
                        <p className="text-danger" role="alert">
                            {error}
                        </p>
                    )}

                    {/* Display registration success messages. */}
                    {message && (
                        <p className="text-success" role="status">
                            {message}
                        </p>
                    )}

                    {/* Submit registration details. */}
                    <button
                        type="submit"
                        className="btn btn-kitaro w-100"
                        disabled={loading || !!message}
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                {/* Link existing users to the login page. */}
                <p className="auth-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </main>
    );
}

export default Signup;
