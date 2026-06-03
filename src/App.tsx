import "./App.css";

function App() {
  return (
    <main className="app">
      <section className="landingPage">
        <nav className="navBar">
          <div></div>

          <div className="navLinks">
            <a href="#">How it works</a>
            <a href="#">About</a>
          </div>
        </nav>

        <div className="heroContent">
          <div className="textSide">
            <div className="projectName">Perspective</div>

            <h1>
              <span>The answer isn&apos;t the point.</span>
              <span>
                The <em>why</em> is.
              </span>
            </h1>

            <p>
              <span>
                Because sometimes the hardest part isn&apos;t finding an answer;
              </span>

              <span>
                it&apos;s understanding why it changed.
              </span>
            </p>

            <button>Explore Perspective →</button>
          </div>

          <div className="lightSide">
            <div className="whiteBeam"></div>

            <div className="splitDot"></div>

            <div className="ray redRay"></div>
            <div className="ray orangeRay"></div>
            <div className="ray yellowRay"></div>
            <div className="ray greenRay"></div>
            <div className="ray blueRay"></div>
            <div className="ray purpleRay"></div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;