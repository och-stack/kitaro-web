
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

// Mock Supabase authentication.
vi.mock("../supabaseClient", () => ({
    default: {
        auth: {
            getSession: vi.fn(),
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

        vi.stubEnv("VITE_API_URL", "http://localhost:3000");

        // This provides a logged-in user for each test.
        supabase.auth.getSession.mockResolvedValue({
            data: {
                session: mockSession,
            },
            error: null,
        });

        // This identifies a normal user when admin access is denied.
        getAdminWasteRecords.mockRejectedValue({
            status: 403,
            message: "Forbidden",
        });

        getMyWasteRecords.mockResolvedValue({
            reports: [],
        });

        // This returns the user's collection area.
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

    it("displays the collection request form and submit button", async () => {
        render(<CollectionRequests />);

        expect(
            await screen.findByRole("heading", {
                name: /submit a collection request/i,
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: /submit request/i,
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: /submitted records/i,
            })
        ).toBeInTheDocument();

        await screen.findByText("Rawang");
    });

    it("displays the form while the profile request is loading", async () => {
        let resolveProfile;

        fetch.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveProfile = resolve;
                })
        );

        render(<CollectionRequests />);

        expect(
            await screen.findByRole("button", {
                name: /submit request/i,
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: /submitted records/i,
            })
        ).toBeInTheDocument();

        expect(screen.getByText("Loading area")).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: /submit request/i,
            })
        ).toBeDisabled();

        // This finishes loading the collection area.
        resolveProfile({
            ok: true,
            json: async () => ({
                profile: {
                    matched_area: "Rawang",
                },
            }),
        });

        expect(await screen.findByText("Rawang")).toBeInTheDocument();

        expect(
            screen.getByRole("button", {
                name: /submit request/i,
            })
        ).toBeEnabled();
    });

    it("displays all available waste categories", async () => {
        render(<CollectionRequests />);

        const categorySelect = await screen.findByLabelText(/waste category/i);

        expect(categorySelect).toHaveDisplayValue("Select category");

        expect(
            screen.getByRole("option", {
                name: "General / Residual Waste & Food Waste",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("option", {
                name: "Paper & Cardboard",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("option", { name: "Plastic" })
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

        expect(
            await screen.findByRole("cell", { name: "Plastic" })
        ).toBeInTheDocument();

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

    it("checks admin access before loading resident records", async () => {
        render(<CollectionRequests />);

        await waitFor(() => {
            expect(getAdminWasteRecords).toHaveBeenCalledTimes(1);
            expect(getMyWasteRecords).toHaveBeenCalledTimes(1);
        });
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

        // This checks that the new record appears without another API request.
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

        // This checks that the deleted record disappears from the table.
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

    it("displays admin records without the resident submission form", async () => {
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

        // Admin accounts do not need to load the resident profile.
        expect(fetch).not.toHaveBeenCalled();
        expect(getMyWasteRecords).not.toHaveBeenCalled();
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

        // This checks that the updated status appears without another API request.
        await waitFor(() => {
            expect(screen.getByDisplayValue("Going")).toBeInTheDocument();
        });

        expect(getAdminWasteRecords).toHaveBeenCalledTimes(1);
    });
});
