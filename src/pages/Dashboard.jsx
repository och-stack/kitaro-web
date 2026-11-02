
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
    getWasteHotspots,
    getWasteComposition,
    getWasteTrends,
} from "../services/api";

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

// 1. Waste Composition Analysis - Doughnut Chart
function WasteCompositionChart({ data }) {
    const chartData = data.map((item) => ({
        name: item.waste_type || "Unknown",
        value: Number(item.report_count || 0),
    }));

    return (
        <section className="dashboard-panel dashboard-chart-panel">
            <div className="dashboard-panel-heading">
                <h2>Waste Composition Analysis</h2>

                <p>
                    Distribution of reports by waste category.
                </p>
            </div>

            {chartData.length === 0 ? (
                <p className="dashboard-empty">
                    No composition data available yet.
                </p>
            ) : (
                <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="45%"
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

                        <Legend
                            verticalAlign="bottom"
                            height={45}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
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
        <section className="dashboard-panel dashboard-chart-panel">
            <div className="dashboard-panel-heading">
                <h2>Waste Reporting Trends</h2>

                <p>
                    Monthly changes in the number of waste reports.
                </p>
            </div>

            {chartData.length === 0 ? (
                <p className="dashboard-empty">
                    No reporting trend data available yet.
                </p>
            ) : (
                <ResponsiveContainer width="100%" height={340}>
                    <LineChart
                        data={chartData}
                        margin={{
                            top: 15,
                            right: 15,
                            left: 0,
                            bottom: 10,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12 }}
                        />

                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                        />

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
        <section className="dashboard-panel dashboard-hotspot-panel">
            <div className="dashboard-panel-heading">
                <h2>Waste Hotspot Analysis</h2>

                <p>
                    Compare total reported waste weight across areas.
                </p>
            </div>

            {chartData.length === 0 ? (
                <p className="dashboard-empty">
                    No hotspot data available yet.
                </p>
            ) : (
                <ResponsiveContainer
                    width="100%"
                    height={Math.max(280, chartData.length * 65)}
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
                            width={120}
                            tick={{ fontSize: 12 }}
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
        </section>
    );
}

// Main Dashboard
function Dashboard() {
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
        <main className="dashboard-page">

            {/* Dashboard Heading */}
            <section className="dashboard-heading">
                <div>
                    <p className="dashboard-eyebrow">
                        KITARO ANALYTICS
                    </p>

                    <h1>
                        Waste Management Overview
                    </h1>

                    <p className="dashboard-description">
                        Monitor waste reports and understand waste
                        management patterns.
                    </p>
                </div>
            </section>

            {/* Loading Message */}
            {loading && (
                <p className="dashboard-message">
                    Loading KITARO analytics...
                </p>
            )}

            {/* Error Messages */}
            {errors.composition && (
                <div className="dashboard-error">
                    Waste composition: {errors.composition}
                </div>
            )}

            {errors.trends && (
                <div className="dashboard-error">
                    Reporting trends: {errors.trends}
                </div>
            )}

            {errors.hotspots && (
                <div className="dashboard-error">
                    Waste hotspot: {errors.hotspots}
                </div>
            )}

            {/* Analytics Charts */}
            {!loading && (
                <>
                    {/* First Row: Two Charts */}
                    <div className="dashboard-chart-grid">

                        <WasteCompositionChart
                            data={analytics.composition}
                        />

                        <WasteTrendsChart
                            data={analytics.trends}
                        />

                    </div>

                    {/* Second Row: Full-width Chart */}
                    <WasteHotspotChart
                        data={analytics.hotspots}
                    />
                </>
            )}

        </main>
    );
}

export default Dashboard;
