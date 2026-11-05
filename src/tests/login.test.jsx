
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Login from "../pages/Login";

// Mock Supabase authentication.
vi.mock("../supabaseClient", () => ({
    default: {
        auth: {
            setSession: vi.fn(),
            signInWithOAuth: vi.fn(),
        },
    },
}));

import supabase from "../supabaseClient";

// Display the current route for navigation tests.
function LocationDisplay() {
    const location = useLocation();

    return <p>Current page: {location.pathname}</p>;
}

function renderLogin(initialEntry = "/login") {
    return render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <>
                            <Login />
                            <LocationDisplay />
                        </>
                    }
                />
                <Route path="/dashboard" element={<p>Dashboard page</p>} />
                <Route path="/profile" element={<p>Profile page</p>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("Login Page", () => {
    beforeEach(() => {
        vi.stubEnv("VITE_API_URL", "http://localhost:3000");
        vi.stubGlobal("fetch", vi.fn());

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it("renders the login heading", () => {
        renderLogin();

        expect(
            screen.getByRole("heading", { name: /log in to kitaro/i })
        ).toBeInTheDocument();
    });

    it("displays email and password fields", () => {
        renderLogin();

        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it("requires email and password", () => {
        renderLogin();

        expect(screen.getByLabelText(/email address/i)).toBeRequired();
        expect(screen.getByLabelText(/^password$/i)).toBeRequired();
    });

    it("displays the Google login button", () => {
        renderLogin();

        expect(
            screen.getByRole("button", { name: /continue with google/i })
        ).toBeInTheDocument();
    });

    it("displays the signup link", () => {
        renderLogin();

        expect(
            screen.getByRole("link", { name: /sign up/i })
        ).toHaveAttribute("href", "/signup");
    });

    it("logs in successfully and redirects to the dashboard", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
            }),
        });

        supabase.auth.setSession.mockResolvedValue({
            error: null,
        });

        renderLogin();

        await user.type(screen.getByLabelText(/email address/i), "test@example.com");
        await user.type(screen.getByLabelText(/^password$/i), "Password123");
        await user.click(screen.getByRole("button", { name: /^log in$/i }));

        await waitFor(() => {
            expect(screen.getByText("Dashboard page")).toBeInTheDocument();
        });

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:3000/api/auth/login",
            expect.objectContaining({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "test@example.com",
                    password: "Password123",
                }),
            })
        );

        expect(supabase.auth.setSession).toHaveBeenCalledWith({
            access_token: "test-access-token",
            refresh_token: "test-refresh-token",
        });
    });

    it("displays an error when login fails", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: false,
            json: async () => ({
                message: "Invalid login credentials",
            }),
        });

        renderLogin();

        await user.type(screen.getByLabelText(/email address/i), "wrong@example.com");
        await user.type(screen.getByLabelText(/^password$/i), "WrongPassword");
        await user.click(screen.getByRole("button", { name: /^log in$/i }));

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent("Invalid login credentials");
    });

    it("displays an error when Supabase cannot save the session", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
            }),
        });

        supabase.auth.setSession.mockResolvedValue({
            error: new Error("Session could not be saved"),
        });

        renderLogin();

        await user.type(screen.getByLabelText(/email address/i), "test@example.com");
        await user.type(screen.getByLabelText(/^password$/i), "Password123");
        await user.click(screen.getByRole("button", { name: /^log in$/i }));

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent("Session could not be saved");
    });

    it("starts Google login", async () => {
        const user = userEvent.setup();

        supabase.auth.signInWithOAuth.mockResolvedValue({
            error: null,
        });

        renderLogin();

        await user.click(
            screen.getByRole("button", { name: /continue with google/i })
        );

        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: "google",
            })
        );
    });

    it("redirects to the previous page after login", async () => {
        const user = userEvent.setup();

        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                access_token: "test-access-token",
                refresh_token: "test-refresh-token",
            }),
        });

        supabase.auth.setSession.mockResolvedValue({
            error: null,
        });

        render(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: "/login",
                        state: { from: { pathname: "/profile" } },
                    },
                ]}
            >
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element={<p>Profile page</p>} />
                </Routes>
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText(/email address/i), "test@example.com");
        await user.type(screen.getByLabelText(/^password$/i), "Password123");
        await user.click(screen.getByRole("button", { name: /^log in$/i }));

        expect(await screen.findByText("Profile page")).toBeInTheDocument();
    });
});
