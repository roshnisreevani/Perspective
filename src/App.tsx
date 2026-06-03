import "./App.css";
function App() {
  return (
    <main className="app">
    <section className="hero">
      <p className="eyebrow">Decision Intelligence Platform</p>

        <h1>Perspective</h1>

        <h2>The answer isn't the point.</h2>

        <p className="tagline">
          Understanding why the answer changes is.
        </p>

          <div className="questionBox">
          <input placeholder="Should I switch majors?" />

          <button>Analyze Perspective</button>
        </div>
    </section>
    </main>
  );
}

 export default App;