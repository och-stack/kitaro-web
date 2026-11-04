
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

                <div className="hero-illustration">
                    <div className="kitaro-recycle-logo">
                        <svg viewBox="0 0 260 230" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M74 69 C87 39 120 27 151 39 L177 49 L157 67 L145 61 C126 53 105 62 96 80 L86 101 L61 87 Z"
                                fill="#FAF9F6"
                            />
                            <path
                                d="M174 78 L199 121 C212 143 202 169 180 181 L160 192 L157 164 L169 157 C180 150 182 137 175 125 L153 87 Z"
                                fill="#BC7653"
                            />
                            <path
                                d="M143 190 L94 190 C68 190 50 171 53 147 L55 122 L78 138 L77 151 C77 163 86 170 99 170 L143 170 Z"
                                fill="#82A69A"
                            />
                            <path
                                d="M104 96 L104 151 M104 124 L137 96 M104 124 L139 153"
                                fill="none"
                                stroke="#123C3A"
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M119 108 Q126 101 133 108"
                                fill="none"
                                stroke="#BC7653"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                            <path
                                d="M119 137 Q128 144 137 136"
                                fill="none"
                                stroke="#123C3A"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

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

                            <p className="recycling-tip">{item.tip}</p>
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
