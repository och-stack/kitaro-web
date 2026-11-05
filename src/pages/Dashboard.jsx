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

// Extract analytics rows from different API response formats.
function getRows(result) {
    const rows =
        result?.analytics ??
        result?.data?.analytics ??
        result?.data ??
        result;

    return Array.isArray(rows) ? rows : [];
}

// Display waste composition using a pie chart.
function WasteCompositionChart({ data }) {
    // Show a message when no data is available.
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
                    {/* Assign colours to each waste category. */}
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
    // Show a message when no data is available.
    if (!data.length) {
        return (
            <p className="dashboard-empty">
                No reporting trend data available.
            </p>
        );
    }

    // Format month values for chart display.
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
    // Show a message when no data is available.
    if (!data.length) {
        return (
            <p className="dashboard-empty">
                No hotspot data available.
            </p>
        );
    }

    // Adjust chart height according to the number of areas.
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
    // Store analytics chart data.
    const [composition, setComposition] = useState([]);
    const [trends, setTrends] = useState([]);
    const [hotspots, setHotspots] = useState([]);

    // Store collection request statistics.
    const [collectionStats, setCollectionStats] = useState({
        total: 0,
        submitted: 0,
        going: 0,
        resolved: 0,
    });

    // Track dashboard loading and error states.
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Store user's matched area and admin access status.
    const [matchedArea, setMatchedArea] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    // Check whether the current user is an admin.
    async function checkAdminAccess() {
        try {
            // Call the Supabase admin checking function.
            const { data, error } = await supabase.rpc("kitaro_is_admin");

            if (error) {
                throw error;
            }

            const adminAccess = data === true;

            setIsAdmin(adminAccess);

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
            // Run all statistics queries at the same time.
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

            // Check whether any query returned an error.
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

            // Update the collection statistics.
            setCollectionStats({
                total: totalResult.count ?? 0,
                submitted: submittedResult.count ?? 0,
                going: goingResult.count ?? 0,
                resolved: resolvedResult.count ?? 0,
            });
        } catch (error) {
            console.error("Collection statistics error:", error);
        }
    }

    // Load user's matched area using their saved postal code.
    async function loadMatchedArea() {
        try {
            // Get the current user's session.
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                return;
            }

            // Retrieve the user's profile information.
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

            // Display saved profile information in the console.
            console.log("Saved postal code:", profile.postal_code);
            console.log("Saved matched area:", profile.matched_area);

            // Update the matched area when available.
            if (profile.matched_area) {
                setMatchedArea(profile.matched_area);
            } else {
                console.log(
                    "Postal code exists, but no matched area has been saved yet."
                );
            }
        } catch (error) {
            console.error("Matched area loading error:", error);
        }
    }

    // Load dashboard analytics when the component mounts.
    useEffect(() => {
        async function loadDashboard() {
            setLoading(true);
            setError("");

            try {
                // Check admin access first.
                const adminAccess = await checkAdminAccess();

                // Load common dashboard information.
                const [
                    compositionResult,
                    trendsResult,
                ] = await Promise.all([
                    getWasteComposition(),
                    getWasteTrends(),
                    loadCollectionStats(),
                    loadMatchedArea(),
                ]).then((results) => [
                    results[0],
                    results[1],
                ]);

                // Update chart data.
                setComposition(getRows(compositionResult));
                setTrends(getRows(trendsResult));

                // Load hotspot analytics only for admins.
                if (adminAccess) {
                    const hotspotResult = await getWasteHotspots();
                    setHotspots(getRows(hotspotResult));
                } else {
                    setHotspots([]);
                }
            } catch (error) {
                console.error("Dashboard loading error:", error);
                setError("Unable to load dashboard analytics.");
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    // Find recycling centres near the matched area.
    function handleFindRecyclingCentres() {
        // Check whether the user's matched area is available.
        if (!matchedArea) {
            alert(
                "No matched area found. Please update your postal code in your profile."
            );
            return;
        }

        // Prepare the Google Maps search query.
        const searchQuery = `recycling centres near ${matchedArea}`;

        // Generate the Google Maps search URL.
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            searchQuery
        )}`;

        // Open Google Maps in a new tab.
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
                <p className="dashboard-message">
                    Loading dashboard analytics...
                </p>
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

                                <WasteHotspotChart data={hotspots} />
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