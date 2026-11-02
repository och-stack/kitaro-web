

function Home() {
    const recyclingItems = [
        {
            icon: "📄",
            title: "Paper & Cardboard",
            description: "Newspapers, cardboard boxes and clean paper.",
            tip: "Keep paper dry and clean before recycling.",
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
            tip: "Separate glass from other recyclable materials.",
        },
        {
            icon: "🥫",
            title: "Metal",
            description: "Aluminium cans and metal containers.",
            tip: "Empty and rinse cans before recycling.",
        },
        {
            icon: "🔋",
            title: "E-waste",
            description: "Batteries, phones and unwanted electronics.",
            tip: "Use an authorised e-waste collection point.",
        },
    ];

    return (
        <main className="home-page">

            {/* Welcome Banner */}
            <section className="home-hero">
                <div className="hero-content">
                    <p className="hero-label">WELCOME TO KITARO</p>

                    <h1>Make Every Resource Count.</h1>

                    <p className="hero-description">
                        Discover smarter ways to manage waste,
                        recycle responsibly and build a cleaner
                        community together.
                    </p>

                    <a href="#recycling-guide" className="hero-button">
                        Explore Recycling Guide
                    </a>
                </div>

                {/* Recycling Character Illustration */}
                <div className="hero-illustration">
                    <div className="character-scene">

                        <div className="character-sparkle sparkle-one">✦</div>
                        <div className="character-sparkle sparkle-two">✧</div>

                        <div className="character-leaf leaf-left">🍃</div>
                        <div className="character-leaf leaf-right">🌿</div>

                        <div className="recycle-character">

                            <div className="character-leaf-top"></div>

                            <div className="character-arm arm-left"></div>
                            <div className="character-arm arm-right"></div>

                            <div className="character-body">
                                <div className="character-face">
                                    <span className="character-eye"></span>
                                    <span className="character-eye"></span>
                                    <span className="character-smile"></span>
                                </div>

                                <div className="character-symbol">♻</div>
                            </div>

                            <div className="character-foot foot-left"></div>
                            <div className="character-foot foot-right"></div>
                        </div>

                        <div className="character-bin">
                            <div className="bin-lid"></div>
                            <div className="bin-icon">♻</div>
                        </div>

                        <div className="character-ground"></div>
                    </div>

                    <p className="character-caption">
                        Your little guide to a greener future 🌱
                    </p>
                </div>
            </section>

            {/* Recycling Information */}
            <section id="recycling-guide" className="recycling-section">
                <div className="section-heading">
                    <p className="section-label">LEARN TO RECYCLE</p>
                    <h2>Know What Goes Where</h2>
                    <p>
                        Understand different waste categories
                        and how to dispose of them responsibly.
                    </p>
                </div>

                <div className="recycling-grid">
                    {recyclingItems.map((item) => (
                        <article className="recycling-card" key={item.title}>
                            <div className="recycling-icon">
                                {item.icon}
                            </div>

                            <h3>{item.title}</h3>

                            <p>{item.description}</p>

                            <div className="recycling-tip">
                                <strong>TIP</strong>
                                <span>{item.tip}</span>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* Learning Poster */}
            <section className="poster-section">
                <div className="section-heading">
                    <p className="section-label">KITARO LEARNING CORNER</p>
                    <h2>Recycling Made Simple</h2>
                    <p>
                        Follow these three simple steps before
                        putting your recyclables into the bin.
                    </p>
                </div>

                <div className="learning-poster">
                    <div className="poster-top">
                        <span className="poster-tag">KITARO ECO GUIDE</span>

                        <h2>3 STEPS TO RECYCLE RIGHT</h2>

                        <p>
                            Make recycling part of your everyday routine.
                        </p>
                    </div>

                    <div className="poster-steps">
                        <div className="poster-step">
                            <div className="poster-step-icon">🧹</div>
                            <span className="step-number">01</span>
                            <h3>EMPTY</h3>
                            <p>
                                Remove leftover food and liquid
                                from recyclable containers.
                            </p>
                        </div>

                        <div className="poster-step">
                            <div className="poster-step-icon">💧</div>
                            <span className="step-number">02</span>
                            <h3>RINSE</h3>
                            <p>
                                Clean containers to remove
                                food residue and dirt.
                            </p>
                        </div>

                        <div className="poster-step">
                            <div className="poster-step-icon">♻️</div>
                            <span className="step-number">03</span>
                            <h3>SORT</h3>
                            <p>
                                Separate materials according
                                to local recycling rules.
                            </p>
                        </div>
                    </div>

                    <div className="poster-bottom">
                        <span>♻️</span>
                        <p>RECYCLE TODAY. PROTECT TOMORROW.</p>
                    </div>
                </div>
            </section>

            {/* Recycling Reminder */}
            <section className="home-reminder">
                <div>
                    <p className="section-label">A SMALL REMINDER</p>
                    <h2>Reduce. Reuse. Recycle.</h2>
                    <p>
                        Responsible waste management starts
                        with the choices we make every day.
                    </p>
                </div>

                <div className="reminder-icon">🌱</div>
            </section>

        </main>
    );
}

export default Home;
