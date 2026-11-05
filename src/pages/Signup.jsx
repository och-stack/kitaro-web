import { useEffect, useRef, useState } from "react";
import supabase from "../supabaseClient";

// Keep profile data while navigating between pages.
let profileCache = null;

function Profile() {
    // Set the initial profile values.
    const [formData, setFormData] = useState(() => ({
        displayName: profileCache?.displayName || "",
        email: profileCache?.email || "",
        userType: profileCache?.userType || "",
        postalCode: profileCache?.postalCode || "",
        area: profileCache?.area || "",
    }));

    // Keep the original values for resetting the form.
    const [originalData, setOriginalData] = useState(() => ({
        displayName: profileCache?.displayName || "",
        email: profileCache?.email || "",
        userType: profileCache?.userType || "",
        postalCode: profileCache?.postalCode || "",
        area: profileCache?.area || "",
    }));

    // Store messages and loading states.
    const [message, setMessage] = useState("");
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Track whether the user has edited the form.
    const hasEdited = useRef(false);

    // Retrieve the latest profile from the backend.
    useEffect(() => {
        async function loadProfile() {
            try {
                // Get the current user's session.
                const { data: sessionData, error: sessionError } =
                    await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                // Get the user's access token.
                const token = sessionData.session?.access_token;

                if (!token) throw new Error("Please log in again.");

                // Request the profile from the backend.
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/profile`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result = await response.json();

                // Handle unsuccessful responses.
                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to retrieve profile."
                    );
                }

                // Prepare the profile data for the form.
                const savedData = {
                    displayName: result.profile.display_name || "",
                    email: sessionData.session.user.email || "",
                    userType: result.profile.user_type || "",
                    postalCode: result.profile.postal_code || "",
                    area: result.profile.matched_area || "",
                };

                // Save the profile data in the cache.
                profileCache = savedData;

                // Avoid overwriting the form while the user is editing.
                if (!hasEdited.current) {
                    setFormData(savedData);
                    setOriginalData(savedData);
                }
            } catch (error) {
                console.error("Load profile error:", error.message);
            }
        }

        // Load the profile when the page opens.
        loadProfile();
    }, []);

    // Update the form when a field changes.
    function handleChange(event) {
        const { name, value } = event.target;

        hasEdited.current = true;

        // Update only the changed field.
        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));

        setMessage("");
    }

    // Look up the area using the Malaysian postcode.
    async function handlePostcodeLookup() {
        const postcode = formData.postalCode.trim();

        // Check that the postcode contains exactly 5 digits.
        if (!/^\d{5}$/.test(postcode)) {
            setMessage("Please enter a valid 5-digit Malaysian postcode.");
            return;
        }

        setIsLookingUp(true);
        setMessage("");

        try {
            // Get the current user's session.
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            // Get the user's access token.
            const token = sessionData.session?.access_token;

            if (!token) throw new Error("Please log in again.");

            // Send the postcode to the backend for lookup.
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

            // Handle unsuccessful responses.
            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to find this postcode."
                );
            }

            // Get the matched area from the response.
            const area = result.profile?.matched_area;

            if (!area) throw new Error("No matched area was returned.");

            // Update the postcode and matched area.
            const updatedData = {
                ...formData,
                postalCode: postcode,
                area,
            };

            // Update the cached profile data.
            profileCache = updatedData;

            setFormData(updatedData);

            // Update the original postcode and area values.
            setOriginalData((previousData) => ({
                ...previousData,
                postalCode: postcode,
                area,
            }));

            hasEdited.current = false;
            setMessage("Area lookup completed.");
        } catch (error) {
            // Display the lookup error.
            setMessage(
                error.message || "Unable to look up this postcode."
            );
        } finally {
            setIsLookingUp(false);
        }
    }

    // Save the updated profile to the backend.
    async function handleSave(event) {
        event.preventDefault();

        setIsSaving(true);
        setMessage("");

        try {
            // Validate the selected account type.
            if (
                !["resident", "small_business"].includes(formData.userType)
            ) {
                throw new Error("Please select a valid account type.");
            }

            // Get the current user's session.
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError) throw sessionError;

            // Get the user's access token.
            const token = sessionData.session?.access_token;

            if (!token) throw new Error("Please log in again.");

            // Send the updated profile to the backend.
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/profile`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    // Send the updated name and account type.
                    body: JSON.stringify({
                        display_name: formData.displayName.trim(),
                        user_type: formData.userType,
                    }),
                }
            );

            const result = await response.json();

            // Handle unsuccessful responses.
            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to save profile."
                );
            }

            // Update the form with the saved profile values.
            const savedData = {
                ...formData,
                displayName: result.profile.display_name,
                userType: result.profile.user_type,
            };

            // Update the cached profile data.
            profileCache = savedData;

            setFormData(savedData);
            setOriginalData(savedData);

            hasEdited.current = false;
            setMessage("Profile updated successfully.");
        } catch (error) {
            // Display the save error.
            setMessage(
                error.message || "Unable to save profile. Please try again."
            );
        } finally {
            setIsSaving(false);
        }
    }

    // Restore the original saved profile values.
    function handleReset() {
        setFormData({ ...originalData });
        hasEdited.current = false;
        setMessage("");
    }

    // Display the profile settings page.
    return (
        <main className="profile-page">
            {/* Display the page heading. */}
            <div className="profile-heading">
                <p className="profile-eyebrow">ACCOUNT SETTINGS</p>
                <h1>My Profile</h1>
                <p>Manage your account information and location.</p>
            </div>

            {/* Display the personal information form. */}
            <section className="profile-card">
                <div className="profile-section-heading">
                    <h2>Personal Information</h2>
                </div>

                <p>Update your basic account details.</p>

                {/* Handle profile updates when the form is submitted. */}
                <form onSubmit={handleSave}>
                    <div className="profile-form-grid">
                        {/* Display name input. */}
                        <div className="profile-field">
                            <label htmlFor="displayName">Display name</label>
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

                        {/* Display the account email as read-only. */}
                        <div className="profile-field">
                            <label htmlFor="email">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-control"
                                value={formData.email}
                                readOnly
                            />
                        </div>

                        {/* Allow users to update their account type. */}
                        <div className="profile-field">
                            <label htmlFor="userType">Account Type</label>

                            {formData.userType === "admin" ? (
                                <input
                                    id="userType"
                                    type="text"
                                    className="form-control"
                                    value="Admin"
                                    readOnly
                                />
                            ) : (
                                <select
                                    id="userType"
                                    name="userType"
                                    className="form-select"
                                    value={formData.userType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>
                                        Select account type
                                    </option>
                                    <option value="resident">Resident</option>
                                    <option value="small_business">
                                        Small Business
                                    </option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Separate personal and location information. */}
                    <div className="profile-divider" />

                    {/* Display the location information section. */}
                    <div className="profile-section-heading">
                        <h2>Location Information</h2>
                        <p>
                            Find your area using your Malaysian postcode.
                        </p>
                    </div>

                    <div className="profile-form-grid">
                        {/* Enter a postcode and look up the area. */}
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

                                {/* Run the postcode lookup. */}
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

                        {/* Display the matched area as read-only. */}
                        <div className="profile-field">
                            <label htmlFor="area">Matched area</label>
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

                    {/* Display success or error messages. */}
                    {message && (
                        <p
                            className="profile-message"
                            role="status"
                            aria-live="polite"
                        >
                            {message}
                        </p>
                    )}

                    {/* Display the reset and save buttons. */}
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