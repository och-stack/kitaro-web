import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../pages/Dashboard";
import supabase from "../supabaseClient";
import {
    getWasteComposition,
    getWasteTrends,
    getWasteHotspots,
} from "../services/api";

// Store mock data for Supabase queries and authentication.
const { mockQueryResults, mockAuthListener } = vi.hoisted(() => ({
    mockQueryResults: {
        counts: [],
        profile: null,
    },
    mockAuthListener: {
        callback: null,
    },
}));

// Mock Recharts components.
vi.mock("recharts", () => {
    const Chart = ({ children }) => <div>{children}</div>;

    return {
        ResponsiveContainer: Chart,
        PieChart: Chart,
        Pie: Chart,
        Cell: () => null,
        Tooltip: () => null,
        Legend: () => null,
        LineChart: Chart,
        Line: () => null,
        XAxis: () => null,
        YAxis: () => null,
        CartesianGrid: () => null,
        BarChart: Chart,
        Bar: () => null,
    };
});

// Mock Supabase.
vi.mock("../supabaseClient", () => ({
    default: {
        auth: {
            getSession: vi.fn(),

            onAuthStateChange: vi.fn((callback) => {
                mockAuthListener.callback = callback;

                return {
                    data: {
                        subscription: {
                            unsubscribe: vi.fn(),
                        },
                    },
                };
            }),
        },
        rpc: vi.fn(),
        from: vi.fn(),
    },
}));

// Mock analytics API functions.
vi.mock("../services/api", () => ({
    getWasteComposition: vi.fn(),
    getWasteTrends: vi.fn(),
    getWasteHotspots: vi.fn(),
}));

// Prepare default analytics data.
const mockComposition = [
    {
        waste_type: "Plastic",
        report_count: 10,
        total_weight: 20,
    },
    {
        waste_type: "Paper & Cardboard",
        report_count: 5,
        total_weight: 15,
    },
];

const mockTrends = [
    {
        month_start: "2026-10-01",
        report_count: 8,
    },
    {
        month_start: "2026-11-01",
        report_count: 12,
    },
];

const mockHotspots = [
    {
        area: "Rawang",
        total_weight: 50,
    },
    {
        area: "Kuala Lumpur",
        total_weight: 30,
    },
];

// Prepare Supabase query results.
function setupStatistics() {
    mockQueryResults.counts = [
        { count: 20, error: null },
        { count: 5, error: null },
        { count: 7, error: null },
        { count: 8, error: null },
    ];

    mockQueryResults.profile = {
        data: {
            postal_code: "48000",
            matched_area: "Rawang",
        },
        error: null,
    };
}

// Create a mock Supabase query.
function createMockQuery() {
    const query = {
        select: vi.fn(() => query),
        ilike: vi.fn(() => query),
        eq: vi.fn(() => query),

        maybeSingle: vi.fn(() =>
            Promise.resolve(mockQueryResults.profile)
        ),

        then: (resolve, reject) => {
            const result = mockQueryResults.counts.shift() || {
                count: 0,
                error: null,
            };

            return Promise.resolve(result).then(resolve, reject);
        },
    };

    return query;
}

beforeEach(() => {
    vi.clearAllMocks();

    // Clear cached dashboard information between tests.
    mockAuthListener.callback?.("SIGNED_OUT");

    // Mock the user's login session.
    supabase.auth.getSession.mockResolvedValue({
        data: {
            session: {
                user: {
                    id: "test-user",
                },
            },
        },
        error: null,
    });

    // Mock normal user access.
    supabase.rpc.mockResolvedValue({
        data: false,
        error: null,
    });

    // Mock Supabase database queries.
    supabase.from.mockImplementation(() => createMockQuery());

    // Mock browser functions.
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(window, "alert").mockImplementation(() => { });

    // Reset database query results.
    setupStatistics();

    // Mock analytics API responses.
    getWasteComposition.mockResolvedValue({
        analytics: mockComposition,
    });

    getWasteTrends.mockResolvedValue({
        analytics: mockTrends,
    });

    getWasteHotspots.mockResolvedValue({
        analytics: mockHotspots,
    });
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Dashboard Page", () => {
    // Test 1: Dashboard heading.
    it("renders the dashboard heading", async () => {
        render(<Dashboard />);

        expect(
            screen.getByRole("heading", { name: "Dashboard" })
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(getWasteComposition).toHaveBeenCalledTimes(1);
            expect(getWasteTrends).toHaveBeenCalledTimes(1);
        });
    });

    // Test 2: Dashboard displays immediately without a loading message.
    it("displays the dashboard immediately", () => {
        render(<Dashboard />);

        expect(
            screen.getByRole("heading", { name: "Dashboard" })
        ).toBeInTheDocument();

        expect(
            screen.queryByText(/loading dashboard analytics/i)
        ).not.toBeInTheDocument();
    });

    // Test 3: Dashboard sections.
    it("displays the dashboard sections", () => {
        render(<Dashboard />);

        expect(
            screen.getByRole("heading", {
                name: "Collection Requests Overview",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", { name: "Waste Composition" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: "Waste Reporting Trends",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", { name: "Explore & Analyse" })
        ).toBeInTheDocument();
    });

    // Test 4: Collection statistics.
    it("displays collection request statistics", async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText("20")).toBeInTheDocument();
            expect(screen.getByText("5")).toBeInTheDocument();
            expect(screen.getByText("7")).toBeInTheDocument();
            expect(screen.getByText("8")).toBeInTheDocument();
        });
    });

    // Test 5: Waste composition analytics.
    it("loads waste composition analytics", async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(getWasteComposition).toHaveBeenCalledTimes(1);
        });
    });

    // Test 6: Waste reporting trends.
    it("loads monthly waste reporting trends", async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(getWasteTrends).toHaveBeenCalledTimes(1);
        });
    });

    // Test 7: Normal users cannot access hotspot analytics.
    it("does not load hotspot analytics for normal users", async () => {
        supabase.rpc.mockResolvedValue({
            data: false,
            error: null,
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(supabase.rpc).toHaveBeenCalledWith("kitaro_is_admin");
        });

        expect(getWasteHotspots).not.toHaveBeenCalled();

        expect(
            screen.queryByText(/waste hotspot analysis/i)
        ).not.toBeInTheDocument();
    });

    // Test 8: Administrators can access hotspot analytics.
    it("loads hotspot analytics for administrators", async () => {
        supabase.rpc.mockResolvedValue({
            data: true,
            error: null,
        });

        render(<Dashboard />);

        expect(
            await screen.findByRole("heading", {
                name: "Waste Hotspot Analysis",
            })
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(getWasteHotspots).toHaveBeenCalledTimes(1);
        });
    });

    // Test 9: Empty waste composition.
    it("displays a message when waste composition data is empty", async () => {
        getWasteComposition.mockResolvedValue({
            analytics: [],
        });

        render(<Dashboard />);

        expect(
            await screen.findByText(
                /no waste composition data available/i
            )
        ).toBeInTheDocument();
    });

    // Test 10: Empty reporting trends.
    it("displays a message when reporting trends are empty", async () => {
        getWasteTrends.mockResolvedValue({
            analytics: [],
        });

        render(<Dashboard />);

        expect(
            await screen.findByText(
                /no reporting trend data available/i
            )
        ).toBeInTheDocument();
    });

    // Test 11: Empty hotspot data.
    it("displays a message when hotspot data is empty", async () => {
        supabase.rpc.mockResolvedValue({
            data: true,
            error: null,
        });

        getWasteHotspots.mockResolvedValue({
            analytics: [],
        });

        render(<Dashboard />);

        expect(
            await screen.findByText(/no hotspot data available/i)
        ).toBeInTheDocument();
    });

    // Test 12: Load matched area.
    it("loads the user's matched area from the profile", async () => {
        render(<Dashboard />);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith("kitaro_users");
        });

        expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

    // Test 13: Open Google Maps.
    it("opens Google Maps using the matched area", async () => {
        const user = userEvent.setup();

        render(<Dashboard />);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith("kitaro_users");
        });

        const button = screen.getByRole("button", {
            name: /find nearby recycling centres/i,
        });

        await user.click(button);

        expect(window.open).toHaveBeenCalledWith(
            "https://www.google.com/maps/search/?api=1&query=recycling%20centres%20near%20Rawang",
            "_blank",
            "noopener,noreferrer"
        );
    });

    // Test 14: Missing matched area.
    it("displays an alert when no matched area is available", async () => {
        const user = userEvent.setup();

        mockQueryResults.profile = {
            data: {
                postal_code: "48000",
                matched_area: null,
            },
            error: null,
        };

        render(<Dashboard />);

        // Wait until the profile request has completed.
        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith("kitaro_users");
        });

        const button = screen.getByRole("button", {
            name: /find nearby recycling centres/i,
        });

        await user.click(button);

        expect(window.alert).toHaveBeenCalledWith(
            "No matched area found. Please update your postal code in your profile."
        );

        expect(window.open).not.toHaveBeenCalled();
    });

    // Test 15: Analytics loading error.
    it("displays an error when analytics fail to load", async () => {
        getWasteComposition.mockRejectedValue(
            new Error("Analytics request failed")
        );

        render(<Dashboard />);

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent(/unable to load dashboard analytics/i);
    });

    // Test 16: Admin permission check error.
    it("handles an unsuccessful admin permission check", async () => {
        supabase.rpc.mockRejectedValue(
            new Error("Permission check failed")
        );

        render(<Dashboard />);

        await waitFor(() => {
            expect(supabase.rpc).toHaveBeenCalledWith("kitaro_is_admin");
        });

        expect(getWasteHotspots).not.toHaveBeenCalled();
    });
});