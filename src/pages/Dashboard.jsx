
import { useEffect, useState } from "react";
import { checkBackendHealth } from "../services/api";

function Dashboard() {
    const [backendStatus, setBackendStatus] = useState("Checking...");

    useEffect(() => {
        checkBackendHealth()
            .then((data) => {
                setBackendStatus("Connected");
                console.log("Backend response:", data);
            })
            .catch((error) => {
                setBackendStatus("Connection failed");
                console.error(error);
            });
    }, []);

    return (
        <main className="dashboard-page">
            <section className="dashboard-overview">
                <p className="dashboard-eyebrow">KITARO ANALYTICS</p>
                <h1>Waste Management Overview</h1>
                <p>Backend status: {backendStatus}</p>
            </section>
        </main>
    );
}

export default Dashboard;
