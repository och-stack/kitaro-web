import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock Supabase before importing Profile.
vi.mock("../supabaseClient", () => ({
    default: {
        auth: {
            getSession: vi.fn(),
        },
    },
}));

import supabase from "../supabaseClient";
import Profile from "../pages/Profile";

describe("Profile Page", () => {
    const mockProfile = {
        display_name: "Test User",
        user_type: "resident",
        postal_code: "48000",
        matched_area: "Rawang",
    };

    beforeEach(() => {
        vi.stubEnv("VITE_API_URL", "http://localhost:3000");

        supabase.auth.getSession.mockResolvedValue({
            data: {
                session: {
                    access_token: "test-access-token",
                    user: {
                        email: "test@example.com",
                    },
                },
            },
            error: null,
        });

        vi.stubGlobal("fetch", vi.fn());

        // Provide a default profile response.
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    // Load profile tests.

    it("renders the profile heading", () => {
        render(<Profile />);

        expect(
            screen.getByRole("heading", { name: /my profile/i })
        ).toBeInTheDocument();
    });

    it("loads the user's profile information", async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });

        render(<Profile />);

        expect(await screen.findByLabelText(/display name/i)).toHaveValue(
            "Test User"
        );

        expect(screen.getByLabelText(/email address/i)).toHaveValue(
            "test@example.com"
        );

        expect(screen.getByLabelText(/account type/i)).toHaveValue("resident");

        expect(screen.getByLabelText(/malaysian postcode/i)).toHaveValue(
            "48000"
        );

        expect(screen.getByLabelText(/matched area/i)).toHaveValue("Rawang");
    });

    it("sends the access token when loading the profile", async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });

        render(<Profile />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:3000/api/profile",
                {
                    headers: {
                        Authorization: "Bearer test-access-token",
                    },
                }
            );
        });
    });

    // Profile editing tests.

    it("allows users to update their display name", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });

        render(<Profile />);

        const nameInput = await screen.findByLabelText(/display name/i);

        await user.clear(nameInput);
        await user.type(nameInput, "Updated User");

        expect(nameInput).toHaveValue("Updated User");
    });

    it("allows users to change their account type", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });

        render(<Profile />);

        const accountType = await screen.findByLabelText(/account type/i);

        await user.selectOptions(accountType, "small_business");

        expect(accountType).toHaveValue("small_business");
    });

    it("does not allow users to edit their email address", async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });

        render(<Profile />);

        const emailInput = await screen.findByLabelText(/email address/i);

        expect(emailInput).toHaveAttribute("readonly");
    });

    // Postcode lookup tests.

    it("rejects an invalid Malaysian postcode", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });

        render(<Profile />);

        const postcodeInput = await screen.findByLabelText(
            /malaysian postcode/i
        );

        await user.clear(postcodeInput);
        await user.type(postcodeInput, "123");

        await user.click(screen.getByRole("button", { name: /find area/i }));

        expect(await screen.findByRole("status")).toHaveTextContent(
            "Please enter a valid 5-digit Malaysian postcode."
        );
    });

    it("looks up the area using a valid postcode", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                profile: {
                    matched_area: "Kuala Lumpur",
                },
            }),
        });

        render(<Profile />);

        const postcodeInput = await screen.findByLabelText(
            /malaysian postcode/i
        );

        await user.clear(postcodeInput);
        await user.type(postcodeInput, "50000");

        await user.click(screen.getByRole("button", { name: /find area/i }));

        expect(await screen.findByLabelText(/matched area/i)).toHaveValue(
            "Kuala Lumpur"
        );

        expect(await screen.findByRole("status")).toHaveTextContent(
            "Area lookup completed."
        );

        expect(fetch).toHaveBeenLastCalledWith(
            "http://localhost:3000/api/postcode/lookup",
            expect.objectContaining({
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer test-access-token",
                },
                body: JSON.stringify({
                    postal_code: "50000",
                }),
            })
        );
    });

    // Profile saving tests.

    it("saves updated profile information", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                profile: {
                    display_name: "Updated User",
                    user_type: "small_business",
                },
            }),
        });

        render(<Profile />);

        const nameInput = await screen.findByLabelText(/display name/i);
        const accountType = screen.getByLabelText(/account type/i);

        await user.clear(nameInput);
        await user.type(nameInput, "Updated User");

        await user.selectOptions(accountType, "small_business");

        await user.click(screen.getByRole("button", { name: /save changes/i }));

        expect(await screen.findByRole("status")).toHaveTextContent(
            "Profile updated successfully."
        );

        expect(fetch).toHaveBeenLastCalledWith(
            "http://localhost:3000/api/profile",
            expect.objectContaining({
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer test-access-token",
                },
                body: JSON.stringify({
                    display_name: "Updated User",
                    user_type: "small_business",
                }),
            })
        );
    });

    // Profile reset test.

    it("resets edited information to the original values", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                profile: mockProfile,
            }),
        });

        render(<Profile />);

        const nameInput = await screen.findByLabelText(/display name/i);

        await user.clear(nameInput);
        await user.type(nameInput, "Temporary Name");

        await user.click(screen.getByRole("button", { name: /^reset$/i }));

        expect(nameInput).toHaveValue("Test User");
    });

    // Admin profile test.

    it("displays the admin account type as read-only", async () => {
        // Return an admin profile from the backend.
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                profile: {
                    ...mockProfile,
                    user_type: "admin",
                },
            }),
        });

        render(<Profile />);

        // Wait until the admin field appears.
        const accountType = await screen.findByDisplayValue("Admin");

        expect(accountType).toHaveAttribute("readonly");
        expect(accountType).toHaveAttribute("type", "text");
    });
});