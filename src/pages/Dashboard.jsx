function Dashboard() {
    return (
        <main className="dashboard-page">
            <section className="dashboard-overview">
                <p className="dashboard-eyebrow">KITARO ANALYTICS</p>

                <h1>Waste Management Overview</h1>

                <p className="dashboard-description">
                    Understand waste patterns, identify hotspots, and monitor
                    changes in waste generation through data-driven insights.
                </p>

                <div className="overview-divider"></div>

                <h2>Explore Your Waste Data</h2>

                <p className="overview-introduction">
                    KITARO brings waste reporting data together to help you
                    understand where waste is reported, how patterns change
                    over time, and which waste categories contribute most
                    to the total recorded waste.
                </p>

                <div className="overview-focus-list">
                    <div className="overview-focus-item">
                        <span className="overview-focus-number">01</span>
                        <div>
                            <h3>Waste Hotspots</h3>
                            <p>
                                Identify areas with higher recorded waste weight
                                and reporting activity.
                            </p>
                        </div>
                    </div>

                    <div className="overview-focus-item">
                        <span className="overview-focus-number">02</span>
                        <div>
                            <h3>Monthly Trends</h3>
                            <p>
                                Monitor changes in recorded waste weight and
                                reporting activity over time.
                            </p>
                        </div>
                    </div>

                    <div className="overview-focus-item">
                        <span className="overview-focus-number">03</span>
                        <div>
                            <h3>Waste Composition</h3>
                            <p>
                                Understand how different waste categories
                                contribute to the total recorded waste.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overview-ai-section">
                    <p className="dashboard-eyebrow">COMING LATER</p>

                    <h2>AI Analyst Insights</h2>

                    <p>
                        Discover patterns and potential opportunities for
                        improvement through AI-powered analysis of KITARO's
                        waste data.
                    </p>
                </div>
            </section>
        </main>
    );
}

export default Dashboard;