
const API_URL = import.meta.env.VITE_API_URL;

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
