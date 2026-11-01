
import { useEffect, useState } from "react";
import supabase from "../supabaseClient";

const wasteCategories = [
    "General / Residual Waste & Food Waste",
    "Paper & Cardboard",
    "Plastic",
    "Glass",
    "Metal",
    "Electronic Waste (E-waste)",
];

// Temporary profile area cache
let cachedProfileArea = "";
let cachedProfileUserId = "";

// Convert Supabase record into frontend format
function formatRecord(report) {
    return {
        id: report.id,
        wasteType: report.waste_type,
        weight: Number(report.waste_weight || 0),
        area: report.area,
        description: report.description,
        submittedAt: report.created_at
            ? new Date(report.created_at).toLocaleString("en-MY", {
                dateStyle: "medium",
                timeStyle: "short",
            })
            : "-",
        status: report.status || "Submitted",
    };
}

function CollectionRequests() {
    const [formData, setFormData] = useState({
        wasteType: "",
        weight: "",
        area: cachedProfileArea,
        description: "",
    });

    const [records, setRecords] = useState([]);

    const [isLoadingArea, setIsLoadingArea] = useState(true);
    const [isLoadingRecords, setIsLoadingRecords] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [areaError, setAreaError] = useState("");
    const [recordsError, setRecordsError] = useState("");
    const [submitError, setSubmitError] = useState("");

    // Load profile area and submitted records independently
    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const { data: sessionData, error: sessionError } =
                    await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                const session = sessionData.session;
                const token = session?.access_token;
                const userId = session?.user?.id;

                if (!token || !userId) {
                    throw new Error("Please sign in to continue.");
                }

                const apiUrl = import.meta.env.VITE_API_URL;

                const headers = {
                    Authorization: `Bearer ${token}`,
                };

                // Show cached area immediately for the same user
                if (
                    cachedProfileUserId === userId &&
                    cachedProfileArea
                ) {
                    setFormData((previousData) => ({
                        ...previousData,
                        area: cachedProfileArea,
                    }));
                }

                // Load profile independently
                async function loadProfile() {
                    try {
                        const response = await fetch(
                            `${apiUrl}/api/profile`,
                            { headers }
                        );

                        const result = await response.json();

                        if (!response.ok) {
                            throw new Error(
                                result.message ||
                                "Unable to load profile area."
                            );
                        }

                        const profileArea =
                            result.profile?.matched_area || "";

                        if (!isMounted) return;

                        cachedProfileUserId = userId;
                        cachedProfileArea = profileArea;

                        setFormData((previousData) => ({
                            ...previousData,
                            area: profileArea,
                        }));

                        setAreaError(
                            profileArea
                                ? ""
                                : "Please update your postcode in your profile first."
                        );
                    } catch (error) {
                        if (isMounted) {
                            setAreaError(error.message);
                        }
                    } finally {
                        if (isMounted) {
                            setIsLoadingArea(false);
                        }
                    }
                }

                // Load records independently
                async function loadRecords() {
                    try {
                        const response = await fetch(
                            `${apiUrl}/api/waste-records`,
                            { headers }
                        );

                        const result = await response.json();

                        if (!response.ok) {
                            throw new Error(
                                result.message ||
                                "Unable to load submitted records."
                            );
                        }

                        if (!isMounted) return;

                        setRecords(
                            (result.reports || []).map(formatRecord)
                        );

                        setRecordsError("");
                    } catch (error) {
                        if (isMounted) {
                            setRecordsError(error.message);
                        }
                    } finally {
                        if (isMounted) {
                            setIsLoadingRecords(false);
                        }
                    }
                }

                // Start both requests without waiting for each other
                loadProfile();
                loadRecords();

            } catch (error) {
                if (isMounted) {
                    setAreaError(error.message);
                    setRecordsError(error.message);
                    setIsLoadingArea(false);
                    setIsLoadingRecords(false);
                }
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    // Handle form input changes
    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    }

    // Submit collection request to backend
    async function handleSubmit(event) {
        event.preventDefault();

        if (!formData.area) {
            setAreaError(
                "Please update your postcode in your profile first."
            );
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");

        try {
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError) {
                throw sessionError;
            }

            const token = sessionData.session?.access_token;

            if (!token) {
                throw new Error(
                    "Your session has expired. Please sign in again."
                );
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/waste-records`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        waste_type: formData.wasteType,
                        waste_weight: Number(formData.weight),
                        area: formData.area.trim(),
                        description: formData.description.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "Unable to submit collection request."
                );
            }

            if (!result.report) {
                throw new Error(
                    "The server did not return the saved record."
                );
            }

            // Display the record returned by Supabase
            const savedRecord = formatRecord(result.report);

            setRecords((previousRecords) => [
                savedRecord,
                ...previousRecords,
            ]);

            // Reset form but keep profile area
            setFormData((previousData) => ({
                ...previousData,
                wasteType: "",
                weight: "",
                description: "",
            }));

        } catch (error) {
            setSubmitError(
                error.message ||
                "Unable to submit collection request."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="collection-page">
            <div className="collection-heading">
                <p className="collection-eyebrow">
                    WASTE MANAGEMENT
                </p>

                <h1>Collection Requests</h1>

                <p>
                    Record your waste and track your submissions.
                </p>
            </div>

            <section className="collection-panel">
                <div className="collection-form-wrapper">
                    <div className="collection-form-content">
                        <h2>Submit a Collection Request</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="collection-form-grid">
                                <div className="collection-field">
                                    <label htmlFor="wasteType">
                                        Waste category
                                    </label>

                                    <select
                                        id="wasteType"
                                        name="wasteType"
                                        className="form-select"
                                        value={formData.wasteType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select category
                                        </option>

                                        {wasteCategories.map((category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="collection-field">
                                    <label htmlFor="weight">
                                        Total waste weight (kg)
                                    </label>

                                    <input
                                        id="weight"
                                        name="weight"
                                        type="number"
                                        className="form-control"
                                        placeholder="e.g. 2.5"
                                        min="0.01"
                                        step="0.01"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="collection-field">
                                    <label htmlFor="area">
                                        Collection area
                                    </label>

                                    <div className="collection-auto-field">
                                        {isLoadingArea && !formData.area ? (
                                            <span className="area-loading">
                                                <span className="area-loading-spinner"></span>
                                                Loading area
                                            </span>
                                        ) : (
                                            formData.area ||
                                            "Area unavailable"
                                        )}
                                    </div>

                                    {areaError && (
                                        <small className="text-danger">
                                            {areaError}
                                        </small>
                                    )}
                                </div>

                                <div className="collection-field">
                                    <label htmlFor="description">
                                        Description
                                    </label>

                                    <input
                                        id="description"
                                        name="description"
                                        type="text"
                                        className="form-control"
                                        placeholder="Describe the waste"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="collection-field">
                                    <label>
                                        Submission date and time
                                    </label>

                                    <div className="collection-auto-field">
                                        Auto on submit
                                    </div>
                                </div>

                                <div className="collection-field">
                                    <label>Request status</label>

                                    <div className="collection-auto-field">
                                        Submitted
                                    </div>
                                </div>

                                <div className="collection-field collection-submit-field">
                                    <button
                                        type="submit"
                                        className="btn btn-kitaro collection-submit-btn"
                                        disabled={
                                            isLoadingArea ||
                                            !formData.area ||
                                            isSubmitting
                                        }
                                    >
                                        {isSubmitting
                                            ? "Submitting..."
                                            : "Submit Request"}
                                    </button>
                                </div>
                            </div>

                            {submitError && (
                                <p className="text-danger mt-3">
                                    {submitError}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </section>

            <section className="collection-panel">
                <div className="collection-records-heading">
                    <h2>Submitted Records</h2>

                    <span>
                        {records.length} record
                        {records.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {recordsError && (
                    <p className="text-danger">
                        {recordsError}
                    </p>
                )}

                <div className="collection-table-wrapper">
                    <table className="table collection-table">
                        <thead>
                            <tr>
                                <th>Waste category</th>
                                <th>Weight (kg)</th>
                                <th>Area</th>
                                <th>Description</th>
                                <th>Submission date and time</th>
                                <th>Request status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoadingRecords ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="collection-empty"
                                    >
                                        Loading submitted records...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="collection-empty"
                                    >
                                        No records yet. Submit your first
                                        collection request above.
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id}>
                                        <td>{record.wasteType}</td>
                                        <td>{record.weight.toFixed(2)}</td>
                                        <td>{record.area}</td>
                                        <td>{record.description}</td>
                                        <td>{record.submittedAt}</td>
                                        <td>
                                            <span className="collection-status">
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}

export default CollectionRequests;
