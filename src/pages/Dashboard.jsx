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

import supabase from "../supabaseClient";

import {
    getWasteHotspots,
    getWasteComposition,
    getWasteTrends,
} from "../services/api";

// Colours used for dashboard charts.
const CHART_COLORS = [
    "#123C3A",
    "#47736D",
    "#BC7653",
    "#8FA9A0",
    "#D8B69F",
    "#A8BDB5",
];

// Temporarily store dashboard information.
let dashboardCache = null;

// Clear cached information when authentication changes.
supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        dashboardCache = null;
    }
});

// Update the dashboard cache.
function updateDashboardCache(data) {
    dashboardCache = {
        ...dashboardCache,
        ...data,
    };
}

// Extract analytics rows from different API response formats.
function getRows(result) {
    const rows =
        result?.analytics ??
        result?.data?.analytics ??
        result?.data?.data ??
        result?.data ??
        result;

    return Array.isArray(rows) ? rows : [];
}

// Display waste composition using a pie chart.
function WasteCompositionChart({ data }) {
    if (!data.length) {
        return (
            <p className="dashboard-empty">
                No waste composition data available.
            </p>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="report_count"
                    nameKey="waste_type"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    innerRadius={55}
                    paddingAngle={3}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={entry.waste_type || index}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                    ))}
                </Pie>

                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

// Display monthly waste reporting trends using a line chart.
function WasteTrendsChart({ data }) {
    if (!data.length) {
        return (
            <p className="dashboard-empty">
                No reporting trend data available.
            </p>
        );
    }

    const chartData = data.map((item) => ({
        ...item,
        month: item.month_start
            ? new Date(item.month_start).toLocaleDateString("en-MY", {
                month: "short",
                year: "numeric",
            })
            : item.month,
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />

                <Line
                    type="monotone"
                    dataKey="report_count"
                    name="Reports"
                    stroke="#BC7653"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

// Display waste hotspots using a horizontal bar chart.
function WasteHotspotChart({ data }) {
    if (!data.length) {
        return (
            <p className="dashboard-empty">
                No hotspot data available.
            </p>
        );
    }

    const chartHeight = Math.max(220, data.length * 65);

    return (
        <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
                data={data}
                layout="vertical"
                barCategoryGap="35%"
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
                <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                />

                <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                />

                <YAxis
                    type="category"
                    dataKey="area"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                />

                <Tooltip />

                <Bar
                    dataKey="total_weight"
                    name="Total Waste Weight"
                    fill="#47736D"
                    barSize={22}
                    radius={[0, 5, 5, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

// Main dashboard component.
function Dashboard() {
    // Display cached analytics immediately when available.
    const [composition, setComposition] = useState(
        () => dashboardCache?.composition ?? []
    );

    const [trends, setTrends] = useState(
        () => dashboardCache?.trends ?? []
    );

    const [hotspots, setHotspots] = useState(
        () => dashboardCache?.hotspots ?? []
    );

    // Store collection request statistics.
    const [collectionStats, setCollectionStats] = useState(
        () => dashboardCache?.collectionStats ?? {
            total: 0,
            submitted: 0,
            going: 0,
            resolved: 0,
        }
    );

    // Only show the main loading screen when no cache exists.
    const [loading, setLoading] = useState(
        () => !dashboardCache
    );

    const [hotspotLoading, setHotspotLoading] = useState(false);
    const [error, setError] = useState("");

    // Store user's matched area and admin access status.
    const [matchedArea, setMatchedArea] = useState(
        () => dashboardCache?.matchedArea ?? ""
    );

    const [isAdmin, setIsAdmin] = useState(
        () => dashboardCache?.isAdmin ?? false
    );

    // Check whether the current user is an admin.
    async function checkAdminAccess() {
        try {
            const { data, error } = await supabase.rpc("kitaro_is_admin");

            if (error) {
                throw error;
            }

            const adminAccess = data === true;

            setIsAdmin(adminAccess);

            updateDashboardCache({
                isAdmin: adminAccess,
            });

            return adminAccess;
        } catch (error) {
            console.error("Admin access check error:", error);
            setIsAdmin(false);

            return false;
        }
    }

    // Load collection request statistics.
    async function loadCollectionStats() {
        try {
            const [
                totalResult,
                submittedResult,
                goingResult,
                resolvedResult,
            ] = await Promise.all([
                supabase
                    .from("kitaro_waste_records")
                    .select("*", { count: "exact", head: true }),

                supabase
                    .from("kitaro_waste_records")
                    .select("*", { count: "exact", head: true })
                    .ilike("status", "submitted"),

                supabase
                    .from("kitaro_waste_records")
                    .select("*", { count: "exact", head: true })
                    .ilike("status", "going"),

                supabase
                    .from("kitaro_waste_records")
                    .select("*", { count: "exact", head: true })
                    .ilike("status", "resolved"),
            ]);

            const results = [
                totalResult,
                submittedResult,
                goingResult,
                resolvedResult,
            ];

            const failedResult = results.find((result) => result.error);

            if (failedResult) {
                throw failedResult.error;
            }

            const stats = {
                total: totalResult.count ?? 0,
                submitted: submittedResult.count ?? 0,
                going: goingResult.count ?? 0,
                resolved: resolvedResult.count ?? 0,
            };

            setCollectionStats(stats);

            updateDashboardCache({
                collectionStats: stats,
            });
        } catch (error) {
            console.error("Collection statistics error:", error);
        }
    }

    // Load user's matched area using their saved postal code.
    async function loadMatchedArea() {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from("kitaro_users")
                .select("postal_code, matched_area")
                .eq("id", session.user.id)
                .maybeSingle();

            if (profileError) {
                throw profileError;
            }

            if (!profile) {
                console.log("User profile not found.");
                return;
            }

            if (profile.matched_area) {
                setMatchedArea(profile.matched_area);

                updateDashboardCache({
                    matchedArea: profile.matched_area,
                });
            }
        } catch (error) {
            console.error("Matched area loading error:", error);
        }
    }

    // Load dashboard information and refresh cached data.
    useEffect(() => {
        let isMounted = true;

        async function loadDashboard() {
            // Only show loading when there is no cached dashboard.
            if (!dashboardCache) {
                setLoading(true);
            }

            setError("");

            try {
                // Start independent requests simultaneously.
                const [
                    adminAccess,
                    compositionResult,
                    trendsResult,
                ] = await Promise.all([
                    checkAdminAccess(),
                    getWasteComposition(),
                    getWasteTrends(),
                    loadCollectionStats(),
                    loadMatchedArea(),
                ]).then((results) => [
                    results[0],
                    results[1],
                    results[2],
                ]);

                if (!isMounted) return;

                // Update analytics information.
                const compositionData = getRows(compositionResult);
                const trendsData = getRows(trendsResult);

                setComposition(compositionData);
                setTrends(trendsData);

                // Save the latest analytics information.
                updateDashboardCache({
                    composition: compositionData,
                    trends: trendsData,
                });

                // Display the dashboard without waiting for hotspots.
                setLoading(false);

                // Load hotspot analytics separately for administrators.
                if (adminAccess && isMounted) {
                    // Keep existing hotspot data visible during refresh.
                    const hasCachedHotspots = Array.isArray(
                        dashboardCache?.hotspots
                    );

                    if (!hasCachedHotspots) {
                        setHotspotLoading(true);
                    }

                    try {
                        const hotspotResult = await getWasteHotspots();

                        if (isMounted) {
                            const hotspotData = getRows(hotspotResult);

                            setHotspots(hotspotData);

                            updateDashboardCache({
                                hotspots: hotspotData,
                            });
                        }
                    } catch (error) {
                        console.error("Hotspot loading error:", error);
                    } finally {
                        if (isMounted) {
                            setHotspotLoading(false);
                        }
                    }
                } else if (isMounted) {
                    setHotspots([]);

                    updateDashboardCache({
                        hotspots: [],
                    });
                }
            } catch (error) {
                console.error("Dashboard loading error:", error);

                if (isMounted) {
                    setError("Unable to load dashboard analytics.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        // Prevent state updates after leaving the dashboard.
        return () => {
            isMounted = false;
        };
    }, []);

    // Find recycling centres near the matched area.
    function handleFindRecyclingCentres() {
        if (!matchedArea) {
            alert(
                "No matched area found. Please update your postal code in your profile."
            );
            return;
        }

        const searchQuery = `recycling centres near ${matchedArea}`;

        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            searchQuery
        )}`;

        window.open(mapsUrl, "_blank", "noopener,noreferrer");
    }

    // Display dashboard content.
    return (
        <main className="dashboard-page">
            <div className="dashboard-heading">
                <div>
                    <p className="dashboard-eyebrow">KITARO ANALYTICS</p>

                    <h1>Dashboard</h1>

                    <p className="dashboard-description">
                        Monitor collection requests, waste composition,
                        reporting trends and waste hotspots.
                    </p>
                </div>
            </div>

            {/* Display dashboard error messages. */}
            {error && (
                <div className="dashboard-error" role="alert">
                    {error}
                </div>
            )}

            {/* Display loading message or dashboard analytics. */}
            {loading ? (
                <div
                    className="dashboard-message"
                    role="status"
                    aria-live="polite"
                >
                    <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                    ></span>
                    Loading dashboard analytics...
                </div>
            ) : (
                <>
                    {/* Collection Requests Overview. */}
                    <section className="dashboard-panel collection-overview-panel">
                        <div className="dashboard-panel-heading">
                            <h2>Collection Requests Overview</h2>
                            <p>
                                Summary of collection request activity.
                            </p>
                        </div>

                        <div className="collection-stats-grid">
                            <div className="collection-stat-card">
                                <h3>{collectionStats.total}</h3>
                                <p>Total Requests</p>
                            </div>

                            <div className="collection-stat-card">
                                <h3>{collectionStats.submitted}</h3>
                                <p>Submitted</p>
                            </div>

                            <div className="collection-stat-card">
                                <h3>{collectionStats.going}</h3>
                                <p>Going</p>
                            </div>

                            <div className="collection-stat-card">
                                <h3>{collectionStats.resolved}</h3>
                                <p>Resolved</p>
                            </div>
                        </div>
                    </section>

                    {/* Main Dashboard Panels. */}
                    <div className="dashboard-top-grid">

                        {/* Waste Composition Chart. */}
                        <section className="dashboard-panel">
                            <div className="dashboard-panel-heading">
                                <h2>Waste Composition</h2>
                                <p>
                                    Breakdown of reported waste categories.
                                </p>
                            </div>

                            <WasteCompositionChart data={composition} />
                        </section>

                        {/* Waste Reporting Trends Chart. */}
                        <section className="dashboard-panel">
                            <div className="dashboard-panel-heading">
                                <h2>Waste Reporting Trends</h2>
                                <p>
                                    Monthly waste reporting activity.
                                </p>
                            </div>

                            <WasteTrendsChart data={trends} />
                        </section>

                        {/* Find nearby recycling centres. */}
                        <section className="dashboard-panel dashboard-ai-panel">
                            <div className="dashboard-panel-heading">
                                <h2>Explore & Analyse</h2>
                                <p>
                                    Find recycling locations near your matched area.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="btn btn-kitaro w-100"
                                onClick={handleFindRecyclingCentres}
                            >
                                <i className="bi bi-geo-alt me-2"></i>
                                Find Nearby Recycling Centres
                            </button>
                        </section>
                    </div>

                    {/* Waste Hotspot Analysis - Admin Only. */}
                    {isAdmin && (
                        <div className="dashboard-bottom-grid">
                            <section className="dashboard-panel dashboard-hotspot-panel">
                                <div className="dashboard-panel-heading">
                                    <h2>Waste Hotspot Analysis</h2>
                                    <p>
                                        Areas with the highest reported waste weight.
                                    </p>
                                </div>

                                {hotspotLoading ? (
                                    <div
                                        className="dashboard-message"
                                        role="status"
                                        aria-live="polite"
                                    >
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            aria-hidden="true"
                                        ></span>
                                        Loading hotspot analytics...
                                    </div>
                                ) : (
                                    <WasteHotspotChart data={hotspots} />
                                )}
                            </section>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

// Export Dashboard for use in other components.
export default Dashboard;
