import { useEffect, useState } from "react";
import supabase from "../supabaseClient";

import {
    createWasteRecord,
    getMyWasteRecords,
    deleteWasteRecord,
    getAdminWasteRecords,
    updateAdminWasteRecordStatus,
} from "../services/api";

// Available waste categories.
const wasteCategories = [
    "General / Residual Waste & Food Waste",
    "Paper & Cardboard",
    "Plastic",
    "Glass",
    "Metal",
    "Electronic Waste (E-waste)",
];

// Available collection request statuses.
const allowedStatuses = [
    "Submitted",
    "Going",
    "Resolved",
];

// Store collection information temporarily.
let collectionCache = null;

// Clear cached information when authentication changes.
if (typeof supabase.auth.onAuthStateChange === "function") {
    supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
            collectionCache = null;
        }
    });
}

// Update the collection cache.
function updateCollectionCache(data) {
    collectionCache = {
        ...collectionCache,
        ...data,
    };
}

// Support both array and { reports: [...] } API responses.
function extractReports(result) {
    if (Array.isArray(result)) {
        return result;
    }

    return result?.reports || [];
}

// Convert Supabase record into frontend format.
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

// Main collection requests component.
function CollectionRequests() {
    // Display cached information immediately.
    const [formData, setFormData] = useState({
        wasteType: "",
        weight: "",
        area: collectionCache?.area || "",
        description: "",
    });

    // Store collection records.
    const [records, setRecords] = useState(
        () => collectionCache?.records ?? []
    );

    // Check whether the current user is an administrator.
    const [isAdmin, setIsAdmin] = useState(
        () => collectionCache?.isAdmin ?? false
    );

    // Track whether the account role has been identified.
    const [isRoleReady, setIsRoleReady] = useState(
        () => Boolean(collectionCache?.userId)
    );

    // Track loading states independently.
    const [isLoadingArea, setIsLoadingArea] = useState(
        () => !collectionCache?.area
    );

    const [isLoadingRecords, setIsLoadingRecords] = useState(
        () => !Array.isArray(collectionCache?.records)
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    // Store error messages.
    const [areaError, setAreaError] = useState("");
    const [recordsError, setRecordsError] = useState("");
    const [submitError, setSubmitError] = useState("");

    // Load profile area for normal users.
    async function loadProfile(userId, token, isMounted) {
        try {
            // Use cached profile area if available.
            if (
                collectionCache?.userId === userId &&
                collectionCache?.area
            ) {
                if (isMounted()) {
                    setFormData((previousData) => ({
                        ...previousData,
                        area: collectionCache.area,
                    }));

                    setIsLoadingArea(false);
                }
            }

            // Fetch profile information from the backend.
            const apiUrl = import.meta.env.VITE_API_URL;

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

            // Update cache.
            updateCollectionCache({
                userId,
                area: profileArea,
            });

            if (isMounted()) {
                setFormData((previousData) => ({
                    ...previousData,
                    area: profileArea,
                }));

                setAreaError(
                    profileArea
                        ? ""
                        : "Please update your postcode in your profile first."
                );
            }
        } catch (error) {
            if (isMounted()) {
                setAreaError(error.message);
            }
        } finally {
            if (isMounted()) {
                setIsLoadingArea(false);
            }
        }
    }

    // Load records using the cached account role when available.
    async function loadRecords(userId, isMounted) {
        try {
            let reports;
            let adminMode;

            // Reuse the cached account role.
            if (collectionCache?.userId === userId) {
                adminMode = collectionCache.isAdmin;

                const result = adminMode
                    ? await getAdminWasteRecords()
                    : await getMyWasteRecords();

                reports = extractReports(result);
            } else {
                // Identify the account role on the first visit.
                const [adminResponse, userResponse] =
                    await Promise.allSettled([
                        getAdminWasteRecords(),
                        getMyWasteRecords(),
                    ]);

                if (adminResponse.status === "fulfilled") {
                    reports = extractReports(adminResponse.value);
                    adminMode = true;
                } else {
                    const adminError = adminResponse.reason;

                    // Only a 403 means the account is not an admin.
                    if (adminError.status !== 403) {
                        throw adminError;
                    }

                    if (userResponse.status === "rejected") {
                        throw userResponse.reason;
                    }

                    reports = extractReports(userResponse.value);
                    adminMode = false;
                }
            }

            // Format records for display.
            const formattedRecords = reports.map((report) =>
                formatRecord(report, adminMode)
            );

            // Update cache.
            updateCollectionCache({
                userId,
                isAdmin: adminMode,
                records: formattedRecords,
            });

            if (isMounted()) {
                setIsAdmin(adminMode);
                setIsRoleReady(true);
                setRecords(formattedRecords);
                setRecordsError("");
            }

            return adminMode;
        } catch (error) {
            if (isMounted()) {
                setRecordsError(error.message);
                setIsRoleReady(true);
            }

            throw error;
        } finally {
            if (isMounted()) {
                setIsLoadingRecords(false);
            }
        }
    }

    // Load initial data when the component mounts.
    useEffect(() => {
        let active = true;

        const isMounted = () => active;

        async function loadData() {
            try {
                // Get the current Supabase session.
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

                if (!isMounted()) return;

                // Prevent another user's cached information from being used.
                if (
                    collectionCache?.userId &&
                    collectionCache.userId !== userId
                ) {
                    collectionCache = null;

                    setRecords([]);
                    setIsAdmin(false);
                    setIsRoleReady(false);

                    setFormData((previousData) => ({
                        ...previousData,
                        area: "",
                    }));

                    setIsLoadingRecords(true);
                    setIsLoadingArea(true);
                }

                // Restore cached information immediately.
                const hasCache =
                    collectionCache?.userId === userId;

                if (hasCache) {
                    setRecords(collectionCache.records || []);
                    setIsAdmin(collectionCache.isAdmin ?? false);
                    setIsRoleReady(true);
                    setIsLoadingRecords(false);

                    if (collectionCache.area) {
                        setFormData((previousData) => ({
                            ...previousData,
                            area: collectionCache.area,
                        }));

                        setIsLoadingArea(false);
                    }
                }

                // Refresh records.
                const recordsPromise = loadRecords(
                    userId,
                    isMounted
                );

                // Refresh profile concurrently for a known normal user.
                const profilePromise =
                    hasCache && !collectionCache.isAdmin
                        ? loadProfile(userId, token, isMounted)
                        : null;

                const adminMode = await recordsPromise;

                if (!isMounted()) return;

                if (adminMode) {
                    setIsLoadingArea(false);
                } else if (profilePromise) {
                    await profilePromise;
                } else {
                    await loadProfile(userId, token, isMounted);
                }
            } catch (error) {
                if (isMounted()) {
                    setRecordsError(error.message);
                    setAreaError(error.message);
                    setIsRoleReady(true);
                    setIsLoadingArea(false);
                    setIsLoadingRecords(false);
                }
            }
        }

        loadData();

        // Prevent state updates after leaving the page.
        return () => {
            active = false;
        };
    }, []);

    // Handle form input changes.
    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    }

    // Submit a new collection request.
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
            // Prepare collection request data.
            const requestData = {
                waste_type: formData.wasteType,
                waste_weight: Number(formData.weight),
                area: formData.area.trim(),
                description: formData.description.trim(),
            };

            // Send collection request to the backend.
            const result = await createWasteRecord(requestData);

            if (!result.report) {
                throw new Error(
                    "The server did not return the saved record."
                );
            }

            // Combine the saved record with submitted information.
            const savedReport = {
                ...requestData,
                ...result.report,
                waste_type:
                    result.report.waste_type ?? requestData.waste_type,
                waste_weight:
                    result.report.waste_weight ?? requestData.waste_weight,
                area: result.report.area ?? requestData.area,
                description:
                    result.report.description ?? requestData.description,
            };

            const newRecord = formatRecord(savedReport, false);

            // Add the new record without fetching the entire table again.
            setRecords((previousRecords) => {
                const updatedRecords = [
                    newRecord,
                    ...previousRecords,
                ];

                updateCollectionCache({
                    records: updatedRecords,
                });

                return updatedRecords;
            });

            // Reset form but keep profile area.
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

    // Delete own Submitted waste record.
    async function handleDelete(id) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this collection request?"
        );

        if (!confirmed) return;

        setDeletingId(id);
        setRecordsError("");

        try {
            // Delete the record from the backend.
            await deleteWasteRecord(id);

            // Remove the deleted record immediately.
            setRecords((previousRecords) => {
                const updatedRecords = previousRecords.filter(
                    (record) => record.id !== id
                );

                updateCollectionCache({
                    records: updatedRecords,
                });

                return updatedRecords;
            });
        } catch (error) {
            setRecordsError(
                error.message || "Unable to delete waste record."
            );
        } finally {
            setDeletingId(null);
        }
    }

    // Admin: Update waste record status.
    async function handleStatusChange(id, status) {
        if (!allowedStatuses.includes(status)) {
            return;
        }

        setUpdatingId(id);
        setRecordsError("");

        try {
            // Update the record status in the backend.
            await updateAdminWasteRecordStatus(id, status);

            // Reflect the confirmed status immediately.
            setRecords((previousRecords) => {
                const updatedRecords = previousRecords.map((record) =>
                    record.id === id
                        ? { ...record, status }
                        : record
                );

                updateCollectionCache({
                    records: updatedRecords,
                });

                return updatedRecords;
            });
        } catch (error) {
            setRecordsError(
                error.message || "Unable to update report status."
            );
        } finally {
            setUpdatingId(null);
        }
    }

    // Display collection request page.
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

            {/* Normal user collection form. */}
            {isRoleReady && !isAdmin && (
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

            {/* Shared records table for normal users and admins. */}
            <section className="collection-panel">
                <div className="collection-records-heading">
                    <h2>Submitted Records</h2>

                    <span>
                        {records.length} record
                        {records.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {recordsError && (
                    <p className="text-danger" role="alert">
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
                            {records.length === 0 && isLoadingRecords ? null : records.length === 0 ? (
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

// Export CollectionRequests for use in other components.
export default CollectionRequests;
