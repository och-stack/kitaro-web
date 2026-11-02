
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
        throw new Error("Please log in to continue.");
    }

    return {
        Authorization: `Bearer ${data.session.access_token}`,
        "Content-Type": "application/json",
    };
}

// Send an authenticated API request
async function authenticatedRequest(endpoint, options = {}) {
    if (!API_URL) {
        throw new Error("Missing VITE_API_URL in the frontend .env file.");
    }

    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        const error = new Error(
            result.message || "The request could not be completed."
        );

        error.status = response.status;

        throw error;
    }

    return result;
}

// Request analytics from the backend
async function fetchAnalytics(endpoint) {
    const result = await authenticatedRequest(
        `/api/analytics/${endpoint}`
    );

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

// USER: Submit a waste report
export async function createWasteRecord(record) {
    return authenticatedRequest("/api/waste-records", {
        method: "POST",
        body: JSON.stringify(record),
    });
}

// USER: View own waste reports
export async function getMyWasteRecords() {
    const result = await authenticatedRequest(
        "/api/waste-records"
    );

    return result.reports;
}

// USER: View one own waste report
export async function getMyWasteRecord(id) {
    const result = await authenticatedRequest(
        `/api/waste-records/${encodeURIComponent(id)}`
    );

    return result.report;
}

// USER: Delete own Submitted waste report
export async function deleteWasteRecord(id) {
    return authenticatedRequest(
        `/api/waste-records/${encodeURIComponent(id)}`,
        {
            method: "DELETE",
        }
    );
}

// ADMIN: View all users' waste reports
export async function getAdminWasteRecords() {
    const result = await authenticatedRequest(
        "/api/admin/waste-records"
    );

    return result.reports;
}

// ADMIN: Update waste report status
export async function updateAdminWasteRecordStatus(id, status) {
    return authenticatedRequest(
        `/api/admin/waste-records/${encodeURIComponent(id)}/status`,
        {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }
    );
}
