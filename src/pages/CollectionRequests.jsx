
import { useState } from "react";

const wasteCategories = [
    "General / Residual Waste & Food Waste",
    "Paper & Cardboard",
    "Plastic",
    "Glass",
    "Metal",
    "Electronic Waste (E-waste)",
];

function CollectionRequests() {
    const [formData, setFormData] = useState({
        wasteType: "",
        weight: "",
        area: "",
        description: "",
    });

    const [records, setRecords] = useState([]);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();

        const newRecord = {
            id: crypto.randomUUID(),
            wasteType: formData.wasteType,
            weight: Number(formData.weight),
            area: formData.area.trim(),
            description: formData.description.trim(),
            submittedAt: new Date().toLocaleString("en-MY", {
                dateStyle: "medium",
                timeStyle: "short",
            }),
            status: "Submitted",
        };

        setRecords((previousRecords) => [
            newRecord,
            ...previousRecords,
        ]);

        setFormData({
            wasteType: "",
            weight: "",
            area: "",
            description: "",
        });
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
                                <option value="">Select category</option>

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
                            <label htmlFor="area">Area</label>

                            <input
                                id="area"
                                name="area"
                                type="text"
                                className="form-control"
                                placeholder="Enter area"
                                value={formData.area}
                                onChange={handleChange}
                                required
                            />
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
                    </div>

                    <div className="collection-form-actions">
                        <button
                            type="submit"
                            className="btn btn-kitaro"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </section>

            <section className="collection-panel">
                <div className="collection-records-heading">
                    <h2>Submitted Records</h2>

                    <span>
                        {records.length} record
                        {records.length !== 1 ? "s" : ""}
                    </span>
                </div>

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
                            {records.length === 0 ? (
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
