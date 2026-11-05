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
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

vi.mock("../supabaseClient", () => ({
    default: {
        auth: {
            getSession: vi.fn(),
        },
    },
}));

let supabase;
let Profile;
let fetch;

const mockProfile = {
    display_name: "Test User",
    user_type: "resident",
    postal_code: "48000",
    matched_area: "Rawang",
};

const createResponse = (data) => ({
    ok: true,
    status: 200,
    json: async () => data,
});

describe("Profile", () => {
    beforeEach(async () => {
        vi.resetModules();

        const supabaseModule = await import("../supabaseClient");
        supabase = supabaseModule.default;

        const profileModule = await import("../pages/Profile");
        Profile = profileModule.default;

        vi.stubEnv("VITE_API_URL", "http://localhost:5000");

        supabase.auth.getSession.mockResolvedValue({
            data: {
                session: {
                    access_token: "test-token",
                    user: {
                        id: "test-user-id",
                        email: "test@example.com",
                    },
                },
            },
            error: null,
        });

        fetch = vi.fn().mockResolvedValue(
            createResponse({
                profile: mockProfile,
            })
        );

        vi.stubGlobal("fetch", fetch);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it("renders the profile heading", () => {
        render(<Profile />);

        expect(
            screen.getByRole("heading", { name: "My Profile" })
        ).toBeInTheDocument();
    });

    it("loads the user's profile information", async () => {
        render(<Profile />);

        await waitFor(() => {
            expect(
                screen.getByLabelText(/display name/i)
            ).toHaveValue("Test User");
        });

        expect(
            screen.getByLabelText(/email address/i)
        ).toHaveValue("test@example.com");

        expect(
            screen.getByLabelText(/account type/i)
        ).toHaveValue("resident");

        expect(
            screen.getByLabelText(/Malaysian postcode/i)
        ).toHaveValue("48000");

        expect(
            screen.getByLabelText(/matched area/i)
        ).toHaveValue("Rawang");
    });

    it("sends the access token when loading the profile", async () => {
        render(<Profile />);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "http://localhost:5000/api/profile",
                expect.objectContaining({
                    headers: {
                        Authorization: "Bearer test-token",
                    },
                })
            );
        });
    });

    it("allows the user to edit their display name", async () => {
        const user = userEvent.setup();

        render(<Profile />);

        const displayNameInput =
            await screen.findByLabelText(/display name/i);

        await user.clear(displayNameInput);
        await user.type(displayNameInput, "Updated User");

        expect(displayNameInput).toHaveValue("Updated User");
    });

    it("allows the user to change their account type", async () => {
        const user = userEvent.setup();

        render(<Profile />);

        const accountTypeInput =
            await screen.findByLabelText(/account type/i);

        await user.selectOptions(
            accountTypeInput,
            "small_business"
        );

        expect(accountTypeInput).toHaveValue("small_business");
    });

    it("keeps the email field read-only", async () => {
        render(<Profile />);

        const emailInput =
            await screen.findByLabelText(/email address/i);

        expect(emailInput).toHaveAttribute("readonly");
    });

    it("shows an error for an invalid postcode", async () => {
        const user = userEvent.setup();

        render(<Profile />);

        const postcodeInput =
            await screen.findByLabelText(/Malaysian postcode/i);

        await user.clear(postcodeInput);
        await user.type(postcodeInput, "123");

        await user.click(
            screen.getByRole("button", { name: /find area/i })
        );

        expect(
            await screen.findByText(
                /valid 5-digit Malaysian postcode/i
            )
        ).toBeInTheDocument();

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("looks up the area using a valid postcode", async () => {
        const user = userEvent.setup();

        fetch
            .mockResolvedValueOnce(
                createResponse({
                    profile: mockProfile,
                })
            )
            .mockResolvedValueOnce(
                createResponse({
                    profile: {
                        matched_area: "Kuala Lumpur",
                    },
                })
            );

        render(<Profile />);

        const postcodeInput =
            await screen.findByLabelText(/Malaysian postcode/i);

        await user.clear(postcodeInput);
        await user.type(postcodeInput, "50000");

        await user.click(
            screen.getByRole("button", { name: /find area/i })
        );

        await waitFor(() => {
            expect(
                screen.getByLabelText(/matched area/i)
            ).toHaveValue("Kuala Lumpur");
        });

        expect(fetch).toHaveBeenLastCalledWith(
            "http://localhost:5000/api/postcode/lookup",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    Authorization: "Bearer test-token",
                    "Content-Type": "application/json",
                }),
                body: JSON.stringify({
                    postal_code: "50000",
                }),
            })
        );
    });

    it("saves the updated profile information", async () => {
        const user = userEvent.setup();

        fetch
            .mockResolvedValueOnce(
                createResponse({
                    profile: mockProfile,
                })
            )
            .mockResolvedValueOnce(
                createResponse({
                    profile: {
                        ...mockProfile,
                        display_name: "Updated User",
                        user_type: "small_business",
                    },
                })
            );

        render(<Profile />);

        const displayNameInput =
            await screen.findByLabelText(/display name/i);

        await user.clear(displayNameInput);
        await user.type(displayNameInput, "Updated User");

        const accountTypeInput =
            screen.getByLabelText(/account type/i);

        await user.selectOptions(
            accountTypeInput,
            "small_business"
        );

        await user.click(
            screen.getByRole("button", { name: /save changes/i })
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenLastCalledWith(
                "http://localhost:5000/api/profile",
                expect.objectContaining({
                    method: "PATCH",
                    headers: expect.objectContaining({
                        Authorization: "Bearer test-token",
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({
                        display_name: "Updated User",
                        user_type: "small_business",
                    }),
                })
            );
        });

        expect(
            await screen.findByText(/profile updated successfully/i)
        ).toBeInTheDocument();
    });

    it("resets the profile form to its original information", async () => {
        const user = userEvent.setup();

        render(<Profile />);

        const displayNameInput =
            await screen.findByLabelText(/display name/i);

        await user.clear(displayNameInput);
        await user.type(displayNameInput, "Changed Name");

        await user.click(
            screen.getByRole("button", { name: /reset/i })
        );

        expect(displayNameInput).toHaveValue("Test User");
    });

    it("displays a read-only account type for administrators", async () => {
        fetch.mockResolvedValueOnce(
            createResponse({
                profile: {
                    ...mockProfile,
                    user_type: "admin",
                },
            })
        );

        render(<Profile />);

        await waitFor(() => {
            expect(
                screen.getByLabelText(/account type/i)
            ).toHaveValue("Admin");
        });

        const accountTypeInput =
            screen.getByLabelText(/account type/i);

        expect(accountTypeInput).toHaveAttribute("readonly");

        expect(
            screen.queryByRole("combobox", {
                name: /account type/i,
            })
        ).not.toBeInTheDocument();
    });

    it("displays cached profile information immediately when revisiting the page", async () => {
        const { unmount } = render(<Profile />);

        await waitFor(() => {
            expect(
                screen.getByLabelText(/display name/i)
            ).toHaveValue("Test User");

            expect(
                screen.getByLabelText(/Malaysian postcode/i)
            ).toHaveValue("48000");

            expect(
                screen.getByLabelText(/matched area/i)
            ).toHaveValue("Rawang");
        });

        unmount();

        fetch.mockReturnValueOnce(new Promise(() => { }));

        render(<Profile />);

        expect(
            screen.getByLabelText(/display name/i)
        ).toHaveValue("Test User");

        expect(
            screen.getByLabelText(/Malaysian postcode/i)
        ).toHaveValue("48000");

        expect(
            screen.getByLabelText(/matched area/i)
        ).toHaveValue("Rawang");
    });
});
