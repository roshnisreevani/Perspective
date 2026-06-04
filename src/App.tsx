import { useRef, useState } from "react";
import "./App.css";

function App() {
  const [ideaStarted, setIdeaStarted] = useState(false);
  const [sceneThreeStarted, setSceneThreeStarted] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollToSection = (id: string) => {
    if (id === "idea") {
      setIdeaStarted(false);
      setSceneThreeStarted(false);

      setTimeout(() => {
        setIdeaStarted(true);
      }, 600);
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleHorizontalScroll = () => {
    if (!scrollerRef.current) return;

    const slideWidth = window.innerWidth;
    const scrollLeft = scrollerRef.current.scrollLeft;

    if (scrollLeft >= slideWidth * 1.6) {
      setSceneThreeStarted(true);
    }
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
              <button onClick={() => scrollToSection("example")}>
                MY MISSION
              </button>
              <button onClick={() => scrollToSection("demo")}>
                TRY IT OUT
              </button>
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
        <div
          ref={scrollerRef}
          className="horizontalScroller"
          onScroll={handleHorizontalScroll}
        >
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
                <div
                  className={`pathCard stabilityPath ${
                    ideaStarted ? "fadeIn2" : ""
                  }`}
                >
                  <span>Stability</span>
                  <p>Keep your job.</p>
                </div>

                <div
                  className={`pathCard growthPath ${
                    ideaStarted ? "fadeIn3" : ""
                  }`}
                >
                  <span>Growth</span>
                  <p>Start the company.</p>
                </div>

                <div
                  className={`pathCard independencePath ${
                    ideaStarted ? "fadeIn4" : ""
                  }`}
                >
                  <span>Independence</span>
                  <p>Build a side business first.</p>
                </div>
              </div>

              <div className={`hookReveal ${ideaStarted ? "fadeIn5" : ""}`}>
                <p>All three recommendations are reasonable.</p>
                <h3>So which one is right?</h3>
              </div>
            </section>

            <section className="parallaxSlide sceneTwo">
              <p className="sceneTwoQuestion">
                So which one is <em>right?</em>
              </p>

              <h2 className="sceneTwoMain">
                There may not be
                <br />
                one correct recommendation.
              </h2>

              <h3 className="sceneTwoReason">
                Because recommendations
                <br />
                depend on more than facts.
              </h3>

              <p className="sceneTwoHuman">
                What matters to one person may not matter to another.
              </p>

              <p className="sceneTwoFinal">
                It all depends on perspective.
              </p>
            </section>

            <section className="parallaxSlide sceneThree">
              <div className="beamFramework">
                <div
                  className={`frameworkItem evidenceItem ${
                    sceneThreeStarted ? "frameworkFade1" : ""
                  }`}
                >
                  <p>Where is this coming from?</p>
                  <span>Evidence</span>
                </div>

                <div
                  className={`frameworkItem assumptionsItem ${
                    sceneThreeStarted ? "frameworkFade2" : ""
                  }`}
                >
                  <span>Assumptions</span>
                  <p>What does it assume about YOU?</p>
                </div>

                <div
                  className={`frameworkItem valuesItem ${
                    sceneThreeStarted ? "frameworkFade3" : ""
                  }`}
                >
                  <p>What is being prioritized?</p>
                  <span>Values</span>
                </div>

                <div
                  className={`frameworkItem biasItem ${
                    sceneThreeStarted ? "frameworkFade4" : ""
                  }`}
                >
                  <span>Bias</span>
                  <p>What might be missing?</p>
                </div>
              </div>

              <h3
  className={`frameworkClosing ${
    sceneThreeStarted ? "frameworkFade5" : ""
  }`}
>
  The recommendation is the <em>result.</em>

  <br />
  <br />

  To understand the answer,
  <br />
  you first need to understand
  <br />
  what shaped it.
</h3>
            </section>

            <section className="parallaxSlide sceneFour">
  <div className="sceneFourContent">
    <div className="sceneFourHeader">
  <p className="sceneFourKicker">The same evidence.</p>
  <h2 className="sceneFourTitle">Different people.</h2>
</div>

    <div className="peopleRow">
      <div className="flipCard studentCard">
        <div className="flipCardInner">
          <div className="flipCardFront">
  <h3 className="personTitle">College Student</h3>

  <p>Graduating next year.</p>
  <p>$40,000 in student loans.</p>
  <p>Trying to enter the workforce.</p>
</div>

          <div className="flipCardBack">
            <p>Recommendation</p>
            <h3>Build experience first.</h3>
          </div>
        </div>
      </div>

     <div className="flipCard engineerCard">
  <div className="flipCardInner">
    <div className="flipCardFront">
      <h3 className="personTitle">Software Engineer</h3>

      <p>Comfortable salary.</p>
      <p>Stable career.</p>
      <p>Dreams of building something bigger.</p>
    </div>

          <div className="flipCardBack">
            <p>Recommendation</p>
            <h3>Start the company.</h3>
          </div>
        </div>
      </div>

      <div className="flipCard parentCard">
        <div className="flipCardInner">
          <div className="flipCardFront">
  <h3 className="personTitle">Parent</h3>

  <p>Two children.</p>
  <p>Mortgage payment.</p>
  <p>Needs predictable income.</p>
</div>

          <div className="flipCardBack">
            <p>Recommendation</p>
            <h3>Keep your job.</h3>
          </div>
        </div>
      </div>
    </div>

    <div className="sceneFourEnding">
  <p>None of them were wrong.</p>
  <h3>They were answering different lives.</h3>

  <button
    className="backHomeButton"
    onClick={() =>
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  >
    GO TO HOMEPAGE
  </button>
</div>
  </div>
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