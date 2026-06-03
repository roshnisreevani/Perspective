import { useState } from "react";
import "./App.css";

function App() {
  const [ideaStarted, setIdeaStarted] = useState(false);
  const scrollToSection = (id: string) => {
  if (id === "idea") {
    setIdeaStarted(false);

    setTimeout(() => {
      setIdeaStarted(true);
    }, 600);
  }

  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

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
              <button onClick={() => scrollToSection("idea")}>THE IDEA</button>
              <button onClick={() => scrollToSection("example")}>MY MISSION</button>
              <button onClick={() => scrollToSection("demo")}>TRY IT OUT</button>
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

      <section id="idea" className="horizontalParallax">
        <div className="horizontalScroller">
          <div className="movingBeam"></div>

          <div className="parallaxTrack">
            <section className="parallaxSlide hookSlide">
<p className={`hookLabel ${ideaStarted ? "fadeIn1" : ""}`}>
  One question.
</p>              
<h2 className={`hookQuestion ${ideaStarted ? "fadeIn1" : ""}`}>
  Should I start a business?
</h2>
              <div className="recommendationPaths">
<div className={`pathCard stabilityPath ${ideaStarted ? "fadeIn2" : ""}`}>                  <span>Stability</span>
                  <p>Keep your job.</p>
                </div>

<div className={`pathCard growthPath ${ideaStarted ? "fadeIn3" : ""}`}>                  <span>Growth</span>
                  <p>Start the company.</p>
                </div>

<div className={`pathCard independencePath ${ideaStarted ? "fadeIn4" : ""}`}>                  <span>Independence</span>
                  <p>Build a side business first.</p>
                </div>
              </div>

<div className={`hookReveal ${ideaStarted ? "fadeIn5" : ""}`}>                <p>All three recommendations are reasonable.</p>
                <h3>So which one is right?</h3>
              </div>
            </section>

            <section className="parallaxSlide">
              <p>Question</p>
              <h2>Should I start a business?</h2>
              <div className="answerCard">Start the company.</div>
            </section>

            <section className="parallaxSlide">
              <h2>That answer has hidden layers.</h2>

              <div className="layersGrid">
                <div>
                  <b>Evidence</b>
                  <span>Growing market demand.</span>
                </div>

                <div>
                  <b>Assumption</b>
                  <span>You can tolerate uncertainty.</span>
                </div>

                <div>
                  <b>Value</b>
                  <span>Growth over stability.</span>
                </div>

                <div>
                  <b>Bias</b>
                  <span>
                    Most sources came from entrepreneurship publications.
                  </span>
                </div>
              </div>
            </section>

            <section className="parallaxSlide">
              <h2>
                The same evidence.
                <br />
                Different priorities.
              </h2>

              <div className="outcomeGrid">
                <div>
                  <b>Stability</b>
                  <span>Keep your job.</span>
                </div>

                <div>
                  <b>Growth</b>
                  <span>Start the company.</span>
                </div>

                <div>
                  <b>Independence</b>
                  <span>Build a side business first.</span>
                </div>
              </div>
            </section>

            <section className="parallaxSlide">
              <h2>The recommendation changed.</h2>
              <h2>The evidence didn&apos;t.</h2>
              <h2>The priorities did.</h2>

              <div className="closingLines">
                <p>Recommendations are not discovered.</p>
                <p>They are constructed.</p>
              </div>

              <h3 className="humanDecision">
                AI Recommendation Complete.
                <br />
                Human Decision Required.
              </h3>
            </section>
          </div>
        </div>
      </section>

      <section id="example" className="placeholderSection">
        <h2>My Mission</h2>
      </section>

      <section id="demo" className="placeholderSection">
        <h2>Try It Out</h2>
      </section>
    </main>
  );
}

export default App;