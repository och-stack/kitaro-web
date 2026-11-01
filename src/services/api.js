
import supabase from "../supabaseClient";

const API_URL = import.meta.env.VITE_API_URL;

// Check whether the backend is running
export async function checkBackendHealth() {
    if (!API_URL) {
        throw new Error("Missing VITE_API_URL in the frontend .env file.");
    }

    const response = await fetch(`${API_URL}/api/health`);

    if (!response.ok) {
        throw new Error(`Backend request failed: ${response.status}`);
    }

    return response.json();
}

// Get the current user's access token
async function getAuthHeaders() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
        throw new Error("Please log in to access analytics.");
    }

    return {
        Authorization: `Bearer ${data.session.access_token}`,
    };
}

// Request analytics from the backend
async function fetchAnalytics(endpoint) {
    if (!API_URL) {
        throw new Error("Missing VITE_API_URL in the frontend .env file.");
    }

    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/analytics/${endpoint}`, {
        headers,
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to fetch analytics.");
    }

    return result.analytics;
}

// KITARO analytics
export async function getWasteHotspots() {
    return fetchAnalytics("hotspots");
}

export async function getWasteComposition() {
    return fetchAnalytics("composition");
}

export async function getWasteTrends() {
    return fetchAnalytics("trends");
}
