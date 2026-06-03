import "./App.css";

function App() {
  return (
    <main className="app">
      <section className="landingPage">
        <nav className="navBar">
          <div></div>
        </nav>

        <div className="heroContent">
          <div className="textSide">
            <div className="projectName">PERSPECTIVE</div>

            <h1>
              <span>The answer isn&apos;t the point.</span>
              <span>
                The <em>why</em> is.
              </span>
            </h1>

            <p>
              <span>Perspective reveals how assumptions, evidence,</span>
              <span>values, and bias shape recommendations.</span>
            </p>
          </div>

          <div className="lightSide">
            <div className="exploreNav">
              <a href="#what-is-perspective">
                THE IDEA
              </a>

              <a href="#example">
                EXAMPLE
              </a>

              <a href="#demo">
                TRY IT OUT
              </a>
            </div>

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

      <section id="what-is-perspective"></section>

      <section id="example"></section>

      <section id="demo"></section>
    </main>
  );
}

export default App;