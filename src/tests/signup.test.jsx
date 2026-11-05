
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Signup from "../pages/Signup";

// Mock Supabase authentication.
vi.mock("../supabaseClient", () => ({
    default: {
        auth: {
            signInWithOAuth: vi.fn(),
        },
    },
}));

import supabase from "../supabaseClient";

describe("Signup Page", () => {
    beforeEach(() => {
        vi.stubEnv("VITE_API_URL", "http://localhost:3000");
        vi.stubGlobal("fetch", vi.fn());

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("renders the signup heading", () => {
        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        expect(
            screen.getByRole("heading", { name: /create your account/i })
        ).toBeInTheDocument();
    });

    it("displays all required registration fields", () => {
        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        expect(screen.getByLabelText(/display name/i)).toBeRequired();
        expect(screen.getByLabelText(/email address/i)).toBeRequired();
        expect(screen.getByLabelText(/account type/i)).toBeRequired();
        expect(screen.getByLabelText(/create a password/i)).toBeRequired();
        expect(screen.getByLabelText(/confirm your password/i)).toBeRequired();
    });

    it("displays both account types", () => {
        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        expect(
            screen.getByRole("option", { name: "Resident" })
        ).toHaveValue("resident");

        expect(
            screen.getByRole("option", { name: "Small Business" })
        ).toHaveValue("small_business");
    });

    it("requires passwords to contain at least eight characters", () => {
        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        expect(screen.getByLabelText(/create a password/i)).toHaveAttribute(
            "minLength",
            "8"
        );

        expect(screen.getByLabelText(/confirm your password/i)).toHaveAttribute(
            "minLength",
            "8"
        );
    });

    it("displays an error when passwords do not match", async () => {
        const user = userEvent.setup();

        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText(/display name/i), "Test User");
        await user.type(screen.getByLabelText(/email address/i), "test@example.com");
        await user.selectOptions(screen.getByLabelText(/account type/i), "resident");
        await user.type(screen.getByLabelText(/create a password/i), "Password123");
        await user.type(screen.getByLabelText(/confirm your password/i), "Different123");

        await user.click(screen.getByRole("button", { name: /create account/i }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Passwords do not match."
        );

        expect(fetch).not.toHaveBeenCalled();
    });

    it("creates an account successfully", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                message: "Account created",
            }),
        });

        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText(/display name/i), "Test User");
        await user.type(screen.getByLabelText(/email address/i), "TEST@EXAMPLE.COM");
        await user.selectOptions(screen.getByLabelText(/account type/i), "resident");
        await user.type(screen.getByLabelText(/create a password/i), "Password123");
        await user.type(screen.getByLabelText(/confirm your password/i), "Password123");

        await user.click(screen.getByRole("button", { name: /create account/i }));

        expect(
            await screen.findByRole("status")
        ).toHaveTextContent(
            "Account created successfully! Please log in to continue."
        );

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:3000/api/auth/signup",
            expect.objectContaining({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    display_name: "Test User",
                    email: "test@example.com",
                    password: "Password123",
                    user_type: "resident",
                }),
            })
        );
    });

    it("displays an error when account creation fails", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({
                message: "Email already registered",
            }),
        });

        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText(/display name/i), "Test User");
        await user.type(screen.getByLabelText(/email address/i), "test@example.com");
        await user.selectOptions(screen.getByLabelText(/account type/i), "resident");
        await user.type(screen.getByLabelText(/create a password/i), "Password123");
        await user.type(screen.getByLabelText(/confirm your password/i), "Password123");

        await user.click(screen.getByRole("button", { name: /create account/i }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Email already registered"
        );
    });

    it("starts Google registration", async () => {
        const user = userEvent.setup();

        supabase.auth.signInWithOAuth.mockResolvedValue({
            error: null,
        });

        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        await user.click(
            screen.getByRole("button", { name: /continue with google/i })
        );

        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: "google",
            })
        );
    });

    it("displays a Google registration error", async () => {
        const user = userEvent.setup();

        supabase.auth.signInWithOAuth.mockResolvedValue({
            error: new Error("Google registration failed"),
        });

        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        await user.click(
            screen.getByRole("button", { name: /continue with google/i })
        );

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Google registration failed"
        );
    });

    it("displays the login link", () => {
        render(
            <MemoryRouter>
                <Signup />
            </MemoryRouter>
        );

        expect(
            screen.getByRole("link", { name: /log in/i })
        ).toHaveAttribute("href", "/login");
    });
});
