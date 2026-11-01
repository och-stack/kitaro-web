
import { useEffect, useState } from "react";
import {
    checkBackendHealth,
    getWasteHotspots,
    getWasteComposition,
    getWasteTrends,
} from "../services/api";

function AnalyticsSection({ title, description, data, loading, error }) {
    // Convert the returned data into rows
    const rows = Array.isArray(data)
        ? data
        : data && typeof data === "object"
            ? [data]
            : [];

    // Get column names from the returned data
    const columns = rows.length > 0
        ? Object.keys(rows[0])
        : [];

    function formatValue(value) {
        if (value === null || value === undefined) {
            return "-";
        }

        if (typeof value === "object") {
            return JSON.stringify(value);
        }

        return String(value);
    }

    return (
        <section className="card shadow-sm border-0 mb-4">
            <div className="card-body">
                <h2 className="h5 mb-1">{title}</h2>
                <p className="text-muted small">{description}</p>

                {loading && (
                    <p className="text-muted">Loading analytics...</p>
                )}

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {!loading && !error && rows.length === 0 && (
                    <p className="text-muted mb-0">
                        No analytics data available yet.
                    </p>
                )}

                {!loading && !error && rows.length > 0 && (
                    <>
                        <p className="small text-muted">
                            {rows.length} record(s)
                        </p>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead>
                                    <tr>
                                        {columns.map((column) => (
                                            <th key={column}>
                                                {column
                                                    .replaceAll("_", " ")
                                                    .replace(/\b\w/g, (letter) =>
                                                        letter.toUpperCase()
                                                    )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {columns.map((column) => (
                                                <td key={column}>
                                                    {formatValue(row[column])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

function Dashboard() {
    const [backendStatus, setBackendStatus] = useState("Checking...");

    const [analytics, setAnalytics] = useState({
        hotspots: null,
        composition: null,
        trends: null,
    });

    const [loading, setLoading] = useState(true);

    const [errors, setErrors] = useState({
        hotspots: "",
        composition: "",
        trends: "",
    });

    useEffect(() => {
        async function loadDashboard() {
            // Check backend connection
            try {
                await checkBackendHealth();
                setBackendStatus("Connected");
            } catch (error) {
                setBackendStatus("Connection failed");
                console.error("Backend error:", error.message);
            }

            // Fetch all three analytics
            const requests = [
                {
                    key: "hotspots",
                    request: getWasteHotspots,
                },
                {
                    key: "composition",
                    request: getWasteComposition,
                },
                {
                    key: "trends",
                    request: getWasteTrends,
                },
            ];

            const results = await Promise.allSettled(
                requests.map((item) => item.request())
            );

            const newAnalytics = {};
            const newErrors = {};

            results.forEach((result, index) => {
                const key = requests[index].key;

                if (result.status === "fulfilled") {
                    newAnalytics[key] = result.value;
                    newErrors[key] = "";
                } else {
                    newAnalytics[key] = null;
                    newErrors[key] = result.reason.message;
                }
            });

            setAnalytics(newAnalytics);
            setErrors(newErrors);
            setLoading(false);
        }

        loadDashboard();
    }, []);

    return (
        <main className="container py-4">
            <section className="mb-4">
                <p className="text-uppercase text-success small fw-semibold mb-1">
                    KITARO ANALYTICS
                </p>

                <h1 className="h2 mb-2">
                    Waste Management Overview
                </h1>

                <p className="text-muted">
                    Monitor waste reports and understand waste management
                    patterns.
                </p>

                <p className="small mb-0">
                    Backend status:{" "}
                    <span
                        className={
                            backendStatus === "Connected"
                                ? "text-success fw-semibold"
                                : "text-danger fw-semibold"
                        }
                    >
                        {backendStatus}
                    </span>
                </p>
            </section>

            <AnalyticsSection
                title="Waste Hotspot Analysis"
                description="Explore waste reporting patterns across different areas."
                data={analytics.hotspots}
                loading={loading}
                error={errors.hotspots}
            />

            <AnalyticsSection
                title="Waste Composition Analysis"
                description="Review the breakdown of reported waste categories."
                data={analytics.composition}
                loading={loading}
                error={errors.composition}
            />

            <AnalyticsSection
                title="Waste Reporting Trends"
                description="Review reporting activity over time."
                data={analytics.trends}
                loading={loading}
                error={errors.trends}
            />
        </main>
    );
}

export default Dashboard;
