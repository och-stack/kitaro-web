import { useState } from "react";

function Profile() {
    const [formData, setFormData] = useState({
        displayName: "",
        email: "",
        postalCode: "",
        area: "",
    });

    const [originalData, setOriginalData] = useState({
        displayName: "",
        email: "",
        postalCode: "",
        area: "",
    });

    const [message, setMessage] = useState("");
    const [isLookingUp, setIsLookingUp] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));

        setMessage("");
    }

    async function handlePostcodeLookup() {
        const postcode = formData.postalCode.trim();

        if (!/^\d{5}$/.test(postcode)) {
            setMessage("Please enter a valid 5-digit Malaysian postcode.");
            return;
        }

        setIsLookingUp(true);
        setMessage("");

        try {
            const response = await fetch(
                `https://countries.dev/postal/MY/${postcode}`
            );

            if (!response.ok) {
                throw new Error("Unable to find this postcode.");
            }

            const data = await response.json();

            const area =
                data.city ||
                data.district ||
                data.locality ||
                data.place_name ||
                "";

            if (!area) {
                setMessage(
                    "The postcode was found, but an area could not be identified."
                );
                return;
            }

            setFormData((previousData) => ({
                ...previousData,
                area,
            }));

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

    function handleSave(event) {
        event.preventDefault();

        setOriginalData({ ...formData });
        setMessage(
            "Profile updated in this session. Database saving will be connected later."
        );
    }

    function handleReset() {
        setFormData({ ...originalData });
        setMessage("");
    }

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
                <div className="profile-section-heading">
                    <h2>Personal Information</h2>

                    <p>
                        Update your basic account details.
                    </p>
                </div>

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
                                onChange={handleChange}
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
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default Profile;