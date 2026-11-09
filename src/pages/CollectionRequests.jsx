
import { useEffect, useState } from "react";
import supabase from "../supabaseClient";
import {
    createWasteRecord,
    getMyWasteRecords,
    deleteWasteRecord,
    getAdminWasteRecords,
    updateAdminWasteRecordStatus,
} from "../services/api";

// These are the available waste categories and request statuses.
const wasteCategories = [
    "General / Residual Waste & Food Waste",
    "Paper & Cardboard",
    "Plastic",
    "Glass",
    "Metal",
    "Electronic Waste (E-waste)",
];

const allowedStatuses = ["Submitted", "Going", "Resolved"];

// This prepares database records for display in the table.
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
            ? report.user?.display_name || "Unknown user"
            : "You",
    };
}

function CollectionRequests() {
    // These states store the form values and collection records.
    const [formData, setFormData] = useState({
        wasteType: "",
        weight: "",
        area: "",
        description: "",
    });

    const [records, setRecords] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isRoleReady, setIsRoleReady] = useState(false);

    // These states control loading and user actions.
    const [isLoadingArea, setIsLoadingArea] = useState(true);
    const [isLoadingRecords, setIsLoadingRecords] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    // These states display errors from API requests.
    const [areaError, setAreaError] = useState("");
    const [recordsError, setRecordsError] = useState("");
    const [submitError, setSubmitError] = useState("");

    // This loads the account, records and profile when the page opens.
    useEffect(() => {
        let active = true;

        async function loadData() {
            try {
                // This retrieves the current user's Supabase session.
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;

                const token = data.session?.access_token;

                if (!token) {
                    throw new Error("Please sign in to continue.");
                }

                // This checks admin access before loading resident records.
                let result;
                let adminMode = false;

                try {
                    result = await getAdminWasteRecords();
                    adminMode = true;
                } catch (error) {
                    if (error.status !== 403) throw error;
                    result = await getMyWasteRecords();
                }

                if (!active) return;

                setIsAdmin(adminMode);
                setIsRoleReady(true);
                setRecords((result.reports || []).map((report) =>
                    formatRecord(report, adminMode)
                ));

                // This loads the collection area only for residents.
                if (!adminMode) {
                    try {
                        const response = await fetch(
                            `${import.meta.env.VITE_API_URL}/api/profile`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                        const profileResult = await response.json();

                        if (!response.ok) {
                            throw new Error(
                                profileResult.message || "Unable to load profile area."
                            );
                        }

                        const area = profileResult.profile?.matched_area || "";

                        if (active) {
                            setFormData((previous) => ({
                                ...previous,
                                area,
                            }));

                            setAreaError(
                                area
                                    ? ""
                                    : "Please update your postcode in your profile first."
                            );
                        }
                    } catch (error) {
                        if (active) setAreaError(error.message);
                    }
                }
            } catch (error) {
                if (active) setRecordsError(error.message);
            } finally {
                if (active) {
                    setIsLoadingArea(false);
                    setIsLoadingRecords(false);
                    setIsRoleReady(true);
                }
            }
        }

        loadData();

        // This prevents state updates after the user leaves the page.
        return () => {
            active = false;
        };
    }, []);

    // This updates the matching form field whenever the user types.
    function handleChange(event) {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    }

    // This validates and submits a new collection request.
    async function handleSubmit(event) {
        event.preventDefault();

        if (!formData.area) {
            setAreaError("Please update your postcode in your profile first.");
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
                throw new Error("The server did not return the saved record.");
            }

            // This adds the saved record without fetching the table again.
            setRecords((previous) => [
                formatRecord(result.report),
                ...previous,
            ]);

            // This clears the form while keeping the collection area.
            setFormData((previous) => ({
                ...previous,
                wasteType: "",
                weight: "",
                description: "",
            }));
        } catch (error) {
            setSubmitError(error.message || "Unable to submit collection request.");
        } finally {
            setIsSubmitting(false);
        }
    }

    // This deletes the resident's own request after confirmation.
    async function handleDelete(id) {
        if (
            !window.confirm(
                "Are you sure you want to delete this collection request?"
            )
        ) {
            return;
        }

        setDeletingId(id);
        setRecordsError("");

        try {
            await deleteWasteRecord(id);

            // This removes the deleted record from the table.
            setRecords((previous) =>
                previous.filter((record) => record.id !== id)
            );
        } catch (error) {
            setRecordsError(error.message || "Unable to delete waste record.");
        } finally {
            setDeletingId(null);
        }
    }

    // This allows admins to update a request's status.
    async function handleStatusChange(id, status) {
        if (!allowedStatuses.includes(status)) return;

        setUpdatingId(id);
        setRecordsError("");

        try {
            await updateAdminWasteRecordStatus(id, status);

            // This updates the displayed status after the backend confirms it.
            setRecords((previous) =>
                previous.map((record) =>
                    record.id === id ? { ...record, status } : record
                )
            );
        } catch (error) {
            setRecordsError(error.message || "Unable to update report status.");
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <main className="collection-page">
            <div className="collection-heading">
                <p className="collection-eyebrow">WASTE MANAGEMENT</p>
                <h1>Collection Requests</h1>
                <p>
                    {isAdmin
                        ? "View and manage submitted waste collection requests."
                        : "Record your waste and track your submissions."}
                </p>
            </div>

            {/* This form is displayed only after a normal user's role is confirmed. */}
            {!isAdmin && isRoleReady && (
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
                                                <option key={category} value={category}>
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
                                            {isLoadingArea && !formData.area
                                                ? "Loading area"
                                                : formData.area || "Area unavailable"}
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
                                        <label>Submission date and time</label>
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
                                            disabled={!formData.area || isSubmitting}
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

            {/* This table displays records for both residents and admins. */}
            <section className="collection-panel">
                <div className="collection-records-heading">
                    <h2>Submitted Records</h2>
                    <span>
                        {records.length} record{records.length !== 1 ? "s" : ""}
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
                            {!records.length && !isLoadingRecords ? (
                                <tr>
                                    <td colSpan="8" className="collection-empty">
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
                                                    disabled={updatingId === record.id}
                                                    onChange={(event) =>
                                                        handleStatusChange(
                                                            record.id,
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    {allowedStatuses.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : record.status === "Submitted" ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(record.id)}
                                                    disabled={deletingId === record.id}
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
