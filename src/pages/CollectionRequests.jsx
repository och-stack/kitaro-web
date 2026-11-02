
import { useEffect, useState } from "react";
import supabase from "../supabaseClient";

import {
    createWasteRecord,
    getMyWasteRecords,
    deleteWasteRecord,
    getAdminWasteRecords,
    updateAdminWasteRecordStatus,
} from "../services/api";

const wasteCategories = [
    "General / Residual Waste & Food Waste",
    "Paper & Cardboard",
    "Plastic",
    "Glass",
    "Metal",
    "Electronic Waste (E-waste)",
];

const allowedStatuses = [
    "Submitted",
    "Going",
    "Resolved",
];

// Temporary profile area cache
let cachedProfileArea = "";
let cachedProfileUserId = "";

// Support both array and { reports: [...] } API responses
function extractReports(result) {
    if (Array.isArray(result)) {
        return result;
    }

    return result?.reports || [];
}

// Convert Supabase record into frontend format
function formatRecord(report, isAdmin = false) {
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
        submittedBy: isAdmin
            ? report.user?.display_name ||
            report.user?.email ||
            "Unknown user"
            : "You",
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

    const [isAdmin, setIsAdmin] = useState(false);

    const [isLoadingArea, setIsLoadingArea] = useState(true);
    const [isLoadingRecords, setIsLoadingRecords] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [deletingId, setDeletingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const [areaError, setAreaError] = useState("");
    const [recordsError, setRecordsError] = useState("");
    const [submitError, setSubmitError] = useState("");

    // Load profile area for normal users
    async function loadProfile(userId, token) {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;

            if (
                cachedProfileUserId === userId &&
                cachedProfileArea
            ) {
                setFormData((previousData) => ({
                    ...previousData,
                    area: cachedProfileArea,
                }));
            }

            const response = await fetch(
                `${apiUrl}/api/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to load profile area."
                );
            }

            const profileArea = result.profile?.matched_area || "";

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
            setAreaError(error.message);
        } finally {
            setIsLoadingArea(false);
        }
    }

    // Load records according to account permissions
    async function loadRecords() {
        try {
            let reports;
            let adminMode = false;

            try {
                // Try administrator endpoint first
                const adminResult = await getAdminWasteRecords();

                reports = extractReports(adminResult);
                adminMode = true;
            } catch (error) {
                // Only a 403 means the account is not an admin
                if (error.status !== 403) {
                    throw error;
                }

                // Normal users can only view their own records
                const userResult = await getMyWasteRecords();

                reports = extractReports(userResult);
            }

            setIsAdmin(adminMode);

            setRecords(
                reports.map((report) =>
                    formatRecord(report, adminMode)
                )
            );

            setRecordsError("");

            return adminMode;
        } catch (error) {
            setRecordsError(error.message);
            throw error;
        } finally {
            setIsLoadingRecords(false);
        }
    }

    // Load initial data
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

                // Check account permissions and load records
                const adminMode = await loadRecords();

                if (!isMounted) return;

                // Only normal users need their profile area
                if (adminMode) {
                    setIsLoadingArea(false);
                } else {
                    await loadProfile(userId, token);
                }
            } catch (error) {
                if (isMounted) {
                    setRecordsError(error.message);
                    setAreaError(error.message);
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

    // Refresh records
    async function refreshRecords() {
        if (isAdmin) {
            const result = await getAdminWasteRecords();
            const reports = extractReports(result);

            setRecords(
                reports.map((report) =>
                    formatRecord(report, true)
                )
            );
        } else {
            const result = await getMyWasteRecords();
            const reports = extractReports(result);

            setRecords(
                reports.map((report) =>
                    formatRecord(report, false)
                )
            );
        }
    }

    // Submit collection request
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
            const result = await createWasteRecord({
                waste_type: formData.wasteType,
                waste_weight: Number(formData.weight),
                area: formData.area.trim(),
                description: formData.description.trim(),
            });

            if (!result.report) {
                throw new Error(
                    "The server did not return the saved record."
                );
            }

            await refreshRecords();

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

    // Delete own Submitted waste record
    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this collection request?"
        );

        if (!confirmed) return;

        setDeletingId(id);
        setRecordsError("");

        try {
            await deleteWasteRecord(id);
            await refreshRecords();
        } catch (error) {
            setRecordsError(
                error.message || "Unable to delete waste record."
            );
        } finally {
            setDeletingId(null);
        }
    }

    // Admin: Update waste record status
    async function handleStatusChange(id, status) {
        if (!allowedStatuses.includes(status)) {
            return;
        }

        setUpdatingId(id);
        setRecordsError("");

        try {
            await updateAdminWasteRecordStatus(id, status);
            await refreshRecords();
        } catch (error) {
            setRecordsError(
                error.message || "Unable to update report status."
            );
        } finally {
            setUpdatingId(null);
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
                    {isAdmin
                        ? "View and manage submitted waste collection requests."
                        : "Record your waste and track your submissions."}
                </p>
            </div>

            {/* Normal user collection form */}
            {!isAdmin && (
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
            )}

            {/* Shared records table */}
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
                                <th>Submitted by</th>
                                <th>Waste category</th>
                                <th>Weight (kg)</th>
                                <th>Area</th>
                                <th>Description</th>
                                <th>Submission date and time</th>
                                <th>Request status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoadingRecords ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="collection-empty"
                                    >
                                        Loading submitted records...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="collection-empty"
                                    >
                                        {isAdmin
                                            ? "No waste records found."
                                            : "No records yet. Submit your first collection request above."}
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id}>
                                        <td>{record.submittedBy}</td>
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

                                        <td>
                                            {isAdmin ? (
                                                <select
                                                    className="form-select"
                                                    value={record.status}
                                                    disabled={
                                                        updatingId === record.id
                                                    }
                                                    onChange={(event) =>
                                                        handleStatusChange(
                                                            record.id,
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    {allowedStatuses.map(
                                                        (status) => (
                                                            <option
                                                                key={status}
                                                                value={status}
                                                            >
                                                                {status}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            ) : record.status === "Submitted" ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() =>
                                                        handleDelete(record.id)
                                                    }
                                                    disabled={
                                                        deletingId === record.id
                                                    }
                                                >
                                                    {deletingId === record.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            ) : (
                                                "-"
                                            )}
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
