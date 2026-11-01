
import { useEffect, useRef, useState } from "react";
import supabase from "../supabaseClient";

// Keep profile data while navigating between pages.
let profileCache = null;

function Profile() {
    const [formData, setFormData] = useState(() => ({
        displayName: profileCache?.displayName || "",
        email: profileCache?.email || "",
        userType: profileCache?.userType || "",
        postalCode: profileCache?.postalCode || "",
        area: profileCache?.area || "",
    }));

    const [originalData, setOriginalData] = useState(() => ({
        displayName: profileCache?.displayName || "",
        email: profileCache?.email || "",
        userType: profileCache?.userType || "",
        postalCode: profileCache?.postalCode || "",
        area: profileCache?.area || "",
    }));

    const [message, setMessage] = useState("");
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Track whether the user has edited the form.
    const hasEdited = useRef(false);

    // Retrieve the latest profile in the background.
    useEffect(() => {
        async function loadProfile() {
            try {
                const { data: sessionData, error: sessionError } =
                    await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                const token = sessionData.session?.access_token;

                if (!token) {
                    throw new Error("Please log in again.");
                }

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/profile`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to retrieve profile."
                    );
                }

                const savedData = {
                    displayName: result.profile.display_name || "",
                    email: sessionData.session.user.email || "",
                    userType: result.profile.user_type || "",
                    postalCode: result.profile.postal_code || "",
                    area: result.profile.matched_area || "",
                };

                profileCache = savedData;

                // Do not overwrite anything the user is currently editing.
                if (!hasEdited.current) {
                    setFormData(savedData);
                    setOriginalData(savedData);
                }
            } catch (error) {
                console.error("Load profile error:", error.message);
            }
        }

        loadProfile();
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        hasEdited.current = true;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));

        setMessage("");
    }

    // Look up postcode through the KITARO backend.
    async function handlePostcodeLookup() {
        const postcode = formData.postalCode.trim();

        if (!/^\d{5}$/.test(postcode)) {
            setMessage("Please enter a valid 5-digit Malaysian postcode.");
            return;
        }

        setIsLookingUp(true);
        setMessage("");

        try {
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            const token = sessionData.session?.access_token;

            if (!token) {
                throw new Error("Please log in again.");
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/postcode/lookup`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        postal_code: postcode,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to find this postcode."
                );
            }

            const area = result.profile?.matched_area;

            if (!area) {
                throw new Error("No matched area was returned.");
            }

            const updatedData = {
                ...formData,
                postalCode: postcode,
                area,
            };

            profileCache = updatedData;

            setFormData(updatedData);
            setOriginalData((previousData) => ({
                ...previousData,
                postalCode: postcode,
                area,
            }));

            hasEdited.current = false;
            setMessage("Area lookup completed.");
        } catch (error) {
            setMessage(
                error.message ||
                "Unable to look up this postcode. Please try again."
            );
        } finally {
            setIsLookingUp(false);
        }
    }

    // Save the display name to Supabase.
    async function handleSave(event) {
        event.preventDefault();

        setIsSaving(true);
        setMessage("");

        try {
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            const token = sessionData.session?.access_token;

            if (!token) {
                throw new Error("Please log in again.");
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/profile`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        display_name: formData.displayName,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to save profile."
                );
            }

            const savedData = {
                ...formData,
                displayName: result.profile.display_name,
            };

            profileCache = savedData;

            setFormData(savedData);
            setOriginalData(savedData);

            hasEdited.current = false;
            setMessage("Profile updated successfully.");
        } catch (error) {
            setMessage(
                error.message || "Unable to save profile. Please try again."
            );
        } finally {
            setIsSaving(false);
        }
    }

    function handleReset() {
        setFormData({ ...originalData });
        hasEdited.current = false;
        setMessage("");
    }

    // Convert the database value into a readable label.
    const accountType =
        formData.userType === "small_business"
            ? "Small Business"
            : formData.userType === "resident"
                ? "Resident"
                : "Not Set";

    return (
        <main className="profile-page">
            <div className="profile-heading">
                <p className="profile-eyebrow">ACCOUNT SETTINGS</p>

                <h1>My Profile</h1>

                <p>
                    Manage your account information and location.
                </p>
            </div>

            <section className="profile-card">
                <div className="profile-section-heading d-flex align-items-center justify-content-between">
                    <h2>Personal Information</h2>

                    <span className="badge bg-success">
                        {accountType}
                    </span>
                </div>

                <p>
                    Update your basic account details.
                </p>

                <form onSubmit={handleSave}>
                    <div className="profile-form-grid">
                        <div className="profile-field">
                            <label htmlFor="displayName">
                                Display name
                            </label>

                            <input
                                id="displayName"
                                name="displayName"
                                type="text"
                                className="form-control"
                                placeholder="Enter your display name"
                                autoComplete="name"
                                value={formData.displayName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="email">
                                Email address
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-control"
                                placeholder="Enter your email address"
                                autoComplete="email"
                                value={formData.email}
                                readOnly
                                required
                            />
                        </div>
                    </div>

                    <div className="profile-divider" />

                    <div className="profile-section-heading">
                        <h2>Location Information</h2>

                        <p>
                            Find your area using your Malaysian postcode.
                        </p>
                    </div>

                    <div className="profile-form-grid">
                        <div className="profile-field">
                            <label htmlFor="postalCode">
                                Malaysian postcode
                            </label>

                            <div className="profile-postcode-group">
                                <input
                                    id="postalCode"
                                    name="postalCode"
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. 48000"
                                    inputMode="numeric"
                                    autoComplete="postal-code"
                                    pattern="[0-9]{5}"
                                    maxLength={5}
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    required
                                />

                                <button
                                    type="button"
                                    className="btn btn-outline-kitaro"
                                    onClick={handlePostcodeLookup}
                                    disabled={isLookingUp}
                                >
                                    {isLookingUp ? "Searching..." : "Find Area"}
                                </button>
                            </div>
                        </div>

                        <div className="profile-field">
                            <label htmlFor="area">
                                Matched area
                            </label>

                            <input
                                id="area"
                                name="area"
                                type="text"
                                className="form-control"
                                placeholder="Area appears after lookup"
                                value={formData.area}
                                readOnly
                            />
                        </div>
                    </div>

                    {message && (
                        <p
                            className="profile-message"
                            role="status"
                            aria-live="polite"
                        >
                            {message}
                        </p>
                    )}

                    <div className="profile-actions">
                        <button
                            type="button"
                            className="btn btn-reset-profile"
                            onClick={handleReset}
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            className="btn btn-kitaro"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default Profile;
