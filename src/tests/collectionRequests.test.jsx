import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from "vitest";

import {
    render,
    screen,
    waitFor,
    cleanup,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";
import CollectionRequests from "../pages/CollectionRequests";

// Store the authentication listener for cache reset.
const { mockAuthListener } = vi.hoisted(() => ({
    mockAuthListener: {
        callback: null,
    },
}));

// Mock Supabase authentication.
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
    },
}));

// Mock backend API functions.
vi.mock("../services/api", () => ({
    createWasteRecord: vi.fn(),
    getMyWasteRecords: vi.fn(),
    deleteWasteRecord: vi.fn(),
    getAdminWasteRecords: vi.fn(),
    updateAdminWasteRecordStatus: vi.fn(),
}));

import supabase from "../supabaseClient";

import {
    createWasteRecord,
    getMyWasteRecords,
    deleteWasteRecord,
    getAdminWasteRecords,
    updateAdminWasteRecordStatus,
} from "../services/api";

describe("Collection Requests Page", () => {
    const mockReport = {
        id: "report-1",
        waste_type: "Plastic",
        waste_weight: 2.5,
        area: "Rawang",
        description: "Plastic bottles",
        created_at: "2026-11-05T10:00:00Z",
        status: "Submitted",
    };

    const mockSession = {
        access_token: "test-access-token",
        user: {
            id: "user-1",
            email: "test@example.com",
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Clear cached collection information between tests.
        mockAuthListener.callback?.("SIGNED_OUT");

        vi.stubEnv("VITE_API_URL", "http://localhost:3000");

        // Mock the current user's session.
        supabase.auth.getSession.mockResolvedValue({
            data: {
                session: mockSession,
            },
            error: null,
        });

        // Normal users receive 403 from the admin endpoint.
        getAdminWasteRecords.mockRejectedValue({
            status: 403,
            message: "Forbidden",
        });

        // Normal users have no existing records by default.
        getMyWasteRecords.mockResolvedValue({
            reports: [],
        });

        // Return the user's collection area.
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    profile: {
                        matched_area: "Rawang",
                    },
                }),
            })
        );
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    // Page display tests.

    it("renders the collection requests heading", async () => {
        render(<CollectionRequests />);

        expect(
            screen.getByRole("heading", {
                name: /collection requests/i,
            })
        ).toBeInTheDocument();

        await waitFor(() => {
            expect(getMyWasteRecords).toHaveBeenCalledTimes(1);
        });
    });

    it("displays the collection request form", async () => {
        render(<CollectionRequests />);

        expect(
            screen.getByRole("heading", {
                name: /submit a collection request/i,
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: /submit request/i,
            })
        ).toBeInTheDocument();

        await screen.findByText("Rawang");
    });

    it("displays all available waste categories", async () => {
        render(<CollectionRequests />);

        const categorySelect = screen.getByLabelText(/waste category/i);

        expect(categorySelect).toHaveDisplayValue("Select category");

        expect(
            screen.getByRole("option", { name: "Plastic" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("option", {
                name: "Paper & Cardboard",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("option", { name: "Glass" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("option", { name: "Metal" })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("option", {
                name: "Electronic Waste (E-waste)",
            })
        ).toBeInTheDocument();

        await screen.findByText("Rawang");
    });

    it("loads the user's collection area", async () => {
        render(<CollectionRequests />);

        expect(await screen.findByText("Rawang")).toBeInTheDocument();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:3000/api/profile",
            {
                headers: {
                    Authorization: "Bearer test-access-token",
                },
            }
        );
    });

    // Records display tests.

    it("displays an empty records message", async () => {
        render(<CollectionRequests />);

        expect(
            await screen.findByText(
                "No records yet. Submit your first collection request above."
            )
        ).toBeInTheDocument();
    });

    it("displays existing waste records", async () => {
        getMyWasteRecords.mockResolvedValue({
            reports: [mockReport],
        });

        render(<CollectionRequests />);

        expect(await screen.findByText("Plastic")).toBeInTheDocument();
        expect(screen.getByText("2.50")).toBeInTheDocument();
        expect(screen.getAllByText("Rawang")).toHaveLength(2);
        expect(screen.getByText("Plastic bottles")).toBeInTheDocument();
        expect(screen.getAllByText("Submitted")).toHaveLength(2);
    });

    it("displays the number of submitted records", async () => {
        getMyWasteRecords.mockResolvedValue({
            reports: [mockReport],
        });

        render(<CollectionRequests />);

        expect(await screen.findByText("1 record")).toBeInTheDocument();
    });

    // Collection request submission tests.

    it("submits a collection request successfully", async () => {
        const user = userEvent.setup();

        createWasteRecord.mockResolvedValue({
            report: mockReport,
        });

        render(<CollectionRequests />);

        await screen.findByText("Rawang");

        await user.selectOptions(
            screen.getByLabelText(/waste category/i),
            "Plastic"
        );

        await user.type(
            screen.getByLabelText(/total waste weight/i),
            "2.5"
        );

        await user.type(
            screen.getByLabelText(/description/i),
            "Plastic bottles"
        );

        await user.click(
            screen.getByRole("button", {
                name: /submit request/i,
            })
        );

        await waitFor(() => {
            expect(createWasteRecord).toHaveBeenCalledWith({
                waste_type: "Plastic",
                waste_weight: 2.5,
                area: "Rawang",
                description: "Plastic bottles",
            });
        });

        // The saved record appears without another records API request.
        expect(await screen.findByText("2.50")).toBeInTheDocument();

        expect(getMyWasteRecords).toHaveBeenCalledTimes(1);

        expect(screen.getByLabelText(/waste category/i)).toHaveValue("");
        expect(
            screen.getByLabelText(/total waste weight/i)
        ).toHaveValue(null);
        expect(screen.getByLabelText(/description/i)).toHaveValue("");
    });

    it("displays an error when collection request submission fails", async () => {
        const user = userEvent.setup();

        createWasteRecord.mockRejectedValue(
            new Error("Unable to submit collection request.")
        );

        render(<CollectionRequests />);

        await screen.findByText("Rawang");

        await user.selectOptions(
            screen.getByLabelText(/waste category/i),
            "Plastic"
        );

        await user.type(
            screen.getByLabelText(/total waste weight/i),
            "2.5"
        );

        await user.type(
            screen.getByLabelText(/description/i),
            "Plastic bottles"
        );

        await user.click(
            screen.getByRole("button", {
                name: /submit request/i,
            })
        );

        expect(
            await screen.findByText(
                "Unable to submit collection request."
            )
        ).toBeInTheDocument();
    });

    // Delete collection request tests.

    it("deletes a submitted collection request after confirmation", async () => {
        const user = userEvent.setup();

        vi.spyOn(window, "confirm").mockReturnValue(true);

        getMyWasteRecords.mockResolvedValue({
            reports: [mockReport],
        });

        deleteWasteRecord.mockResolvedValue({});

        render(<CollectionRequests />);

        await screen.findByText("Plastic bottles");

        await user.click(
            screen.getByRole("button", {
                name: /delete/i,
            })
        );

        await waitFor(() => {
            expect(deleteWasteRecord).toHaveBeenCalledWith("report-1");
        });

        expect(window.confirm).toHaveBeenCalled();

        // The record disappears without another records API request.
        expect(
            await screen.findByText(
                "No records yet. Submit your first collection request above."
            )
        ).toBeInTheDocument();

        expect(getMyWasteRecords).toHaveBeenCalledTimes(1);
    });

    it("does not delete a request when confirmation is cancelled", async () => {
        const user = userEvent.setup();

        vi.spyOn(window, "confirm").mockReturnValue(false);

        getMyWasteRecords.mockResolvedValue({
            reports: [mockReport],
        });

        render(<CollectionRequests />);

        await screen.findByText("Plastic bottles");

        await user.click(
            screen.getByRole("button", {
                name: /delete/i,
            })
        );

        expect(deleteWasteRecord).not.toHaveBeenCalled();
    });

    // Admin permission tests.

    it("displays admin records without the user submission form", async () => {
        getAdminWasteRecords.mockResolvedValue({
            reports: [
                {
                    ...mockReport,
                    user: {
                        display_name: "Admin Test User",
                    },
                },
            ],
        });

        render(<CollectionRequests />);

        expect(
            await screen.findByText("Admin Test User")
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("heading", {
                name: /submit a collection request/i,
            })
        ).not.toBeInTheDocument();

        expect(fetch).not.toHaveBeenCalled();
    });

    it("allows an admin to update a report status", async () => {
        const user = userEvent.setup();

        getAdminWasteRecords.mockResolvedValue({
            reports: [mockReport],
        });

        updateAdminWasteRecordStatus.mockResolvedValue({});

        render(<CollectionRequests />);

        const statusSelect = await screen.findByDisplayValue("Submitted");

        await user.selectOptions(statusSelect, "Going");

        await waitFor(() => {
            expect(updateAdminWasteRecordStatus).toHaveBeenCalledWith(
                "report-1",
                "Going"
            );
        });

        // The updated status appears without fetching the records again.
        await waitFor(() => {
            expect(
                screen.getByDisplayValue("Going")
            ).toBeInTheDocument();
        });

        expect(getAdminWasteRecords).toHaveBeenCalledTimes(1);
    });
});