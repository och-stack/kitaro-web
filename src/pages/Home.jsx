
function Home() {
    const recyclingItems = [
        {
            icon: "📄",
            title: "Paper & Cardboard",
            description: "Newspapers, cardboard boxes and clean paper.",
            tip: "Keep paper dry and clean.",
        },
        {
            icon: "🥤",
            title: "Plastic",
            description: "Plastic bottles, containers and packaging.",
            tip: "Rinse containers before recycling.",
        },
        {
            icon: "🍾",
            title: "Glass",
            description: "Glass bottles and jars.",
            tip: "Separate glass from other materials.",
        },
        {
            icon: "🥫",
            title: "Metal",
            description: "Aluminium cans and metal containers.",
            tip: "Empty and rinse cans.",
        },
        {
            icon: "🔋",
            title: "E-waste",
            description: "Batteries, phones and unwanted electronics.",
            tip: "Use an authorised collection point.",
        },
    ];

    return (
        <main className="home-page">

            {/* Hero */}
            <section className="home-hero">
                <div className="hero-content">
                    <p className="hero-label">WELCOME TO KITARO</p>

                    <h1>Make Every Resource Count.</h1>

                    <p className="hero-description">
                        Smarter waste management.
                        Better everyday choices.
                        A cleaner community.
                    </p>

                    <a href="#recycling-guide" className="hero-button">
                        Explore Recycling Guide
                    </a>
                </div>

                {/* KITARO Logo */}
                <div className="hero-illustration">
                    <img
                        src="/kitaro-favicon.svg"
                        alt="KITARO recycling logo"
                        className="kitaro-recycle-logo"
                    />

                    <p className="character-caption">
                        Make every resource count.
                    </p>
                </div>
            </section>

            {/* Recycling Guide */}
            <section id="recycling-guide" className="recycling-section">
                <div className="section-heading">
                    <p className="section-label">THE RECYCLING GUIDE</p>

                    <h2>Waste, Reimagined.</h2>

                    <p>
                        Everyday materials deserve a second life.
                        Learn how to sort and recycle them responsibly.
                    </p>
                </div>

                <div className="recycling-list">
                    {recyclingItems.map((item) => (
                        <article className="recycling-row" key={item.title}>
                            <span className="recycling-icon">
                                {item.icon}
                            </span>

                            <div className="recycling-details">
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>

                            <p className="recycling-tip">
                                {item.tip}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            {/* Closing Message */}
            <section className="home-reminder">
                <p className="section-label">A BETTER WAY FORWARD</p>

                <h2>Small Actions. Lasting Impact.</h2>

                <p>
                    Reduce what you use. Reuse what you can.
                    Recycle what is suitable.
                </p>
            </section>

        </main>
    );
}

export default Home;
