
import { useEffect, useState } from "react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar,
} from "recharts";

import {
    checkBackendHealth,
    getWasteHotspots,
    getWasteComposition,
    getWasteTrends,
} from "../services/api";

// Chart colours
const CHART_COLORS = [
    "#287B68",
    "#BC7653",
    "#E5B85C",
    "#719B91",
    "#8B9DAA",
    "#A8B98A",
];

// Extract analytics data from API response
function getRows(result) {
    const data =
        result?.analytics ??
        result?.data?.analytics ??
        result?.data ??
        result;

    return Array.isArray(data) ? data : [];
}

// Format numbers
function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

// 1. Waste Composition - Doughnut Chart
function WasteCompositionChart({ data }) {
    const chartData = data.map((item) => ({
        name: item.waste_type || "Unknown",
        value: Number(item.report_count || 0),
    }));

    return (
        <section className="card shadow-sm border-0 mb-4">
            <div className="card-body">
                <h2 className="h5 mb-1">
                    Waste Composition Analysis
                </h2>

                <p className="text-muted small">
                    Distribution of reports by waste category.
                </p>

                {chartData.length === 0 ? (
                    <p className="text-muted mb-0">
                        No composition data available yet.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={105}
                                paddingAngle={3}
                            >
                                {chartData.map((item, index) => (
                                    <Cell
                                        key={`${item.name}-${index}`}
                                        fill={
                                            CHART_COLORS[
                                            index % CHART_COLORS.length
                                            ]
                                        }
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                formatter={(value) => [
                                    formatNumber(value),
                                    "Reports",
                                ]}
                            />

                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
}

// 2. Waste Reporting Trends - Line Chart
function WasteTrendsChart({ data }) {
    const chartData = data.map((item) => {
        const date = new Date(`${item.month_start}T00:00:00`);

        return {
            month: Number.isNaN(date.getTime())
                ? item.month_start
                : date.toLocaleDateString("en-MY", {
                    month: "short",
                    year: "numeric",
                }),
            report_count: Number(item.report_count || 0),
        };
    });

    return (
        <section className="card shadow-sm border-0 mb-4">
            <div className="card-body">
                <h2 className="h5 mb-1">
                    Waste Reporting Trends
                </h2>

                <p className="text-muted small">
                    Monthly changes in the number of waste reports.
                </p>

                {chartData.length === 0 ? (
                    <p className="text-muted mb-0">
                        No reporting trend data available yet.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 20,
                                left: 5,
                                bottom: 10,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="month" />

                            <YAxis allowDecimals={false} />

                            <Tooltip
                                formatter={(value) => [
                                    formatNumber(value),
                                    "Reports",
                                ]}
                            />

                            <Legend />

                            <Line
                                type="monotone"
                                dataKey="report_count"
                                name="Reports"
                                stroke="#287B68"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                activeDot={{ r: 7 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
}

// 3. Waste Hotspot Analysis - Horizontal Bar Chart
function WasteHotspotChart({ data }) {
    const chartData = data.map((item) => ({
        area: item.area || "Unknown",
        total_weight: Number(item.total_weight || 0),
    }));

    return (
        <section className="card shadow-sm border-0 mb-4">
            <div className="card-body">
                <h2 className="h5 mb-1">
                    Waste Hotspot Analysis
                </h2>

                <p className="text-muted small">
                    Compare total reported waste weight across areas.
                </p>

                {chartData.length === 0 ? (
                    <p className="text-muted mb-0">
                        No hotspot data available yet.
                    </p>
                ) : (
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(250, chartData.length * 65)}
                    >
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{
                                top: 10,
                                right: 30,
                                left: 20,
                                bottom: 10,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis
                                type="number"
                                allowDecimals={false}
                            />

                            <YAxis
                                type="category"
                                dataKey="area"
                                width={100}
                            />

                            <Tooltip
                                formatter={(value) => [
                                    `${formatNumber(value)} kg`,
                                    "Total Waste",
                                ]}
                            />

                            <Bar
                                dataKey="total_weight"
                                name="Total Waste"
                                fill="#287B68"
                                radius={[0, 6, 6, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    );
}

// Main Dashboard
function Dashboard() {
    const [backendStatus, setBackendStatus] = useState("Checking...");

    const [analytics, setAnalytics] = useState({
        hotspots: [],
        composition: [],
        trends: [],
    });

    const [loading, setLoading] = useState(true);

    const [errors, setErrors] = useState({
        hotspots: "",
        composition: "",
        trends: "",
    });

    useEffect(() => {
        let isMounted = true;

        async function loadDashboard() {
            try {
                await checkBackendHealth();

                if (isMounted) {
                    setBackendStatus("Connected");
                }
            } catch (error) {
                if (isMounted) {
                    setBackendStatus("Connection failed");
                }

                console.error("Backend error:", error.message);
            }

            const requests = [
                { key: "hotspots", request: getWasteHotspots },
                { key: "composition", request: getWasteComposition },
                { key: "trends", request: getWasteTrends },
            ];

            const results = await Promise.allSettled(
                requests.map((item) => item.request())
            );

            if (!isMounted) return;

            const newAnalytics = {};
            const newErrors = {};

            results.forEach((result, index) => {
                const key = requests[index].key;

                if (result.status === "fulfilled") {
                    newAnalytics[key] = getRows(result.value);
                    newErrors[key] = "";
                } else {
                    newAnalytics[key] = [];
                    newErrors[key] =
                        result.reason?.message ||
                        "Unable to load analytics.";
                }
            });

            setAnalytics(newAnalytics);
            setErrors(newErrors);
            setLoading(false);
        }

        loadDashboard();

        return () => {
            isMounted = false;
        };
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

            {loading && (
                <p className="text-muted">
                    Loading KITARO analytics...
                </p>
            )}

            {errors.hotspots && (
                <div className="alert alert-danger">
                    Waste hotspot: {errors.hotspots}
                </div>
            )}

            {errors.composition && (
                <div className="alert alert-danger">
                    Waste composition: {errors.composition}
                </div>
            )}

            {errors.trends && (
                <div className="alert alert-danger">
                    Reporting trends: {errors.trends}
                </div>
            )}

            {!loading && (
                <>
                    <WasteCompositionChart
                        data={analytics.composition}
                    />

                    <WasteTrendsChart
                        data={analytics.trends}
                    />

                    <WasteHotspotChart
                        data={analytics.hotspots}
                    />
                </>
            )}
        </main>
    );
}

export default Dashboard;
