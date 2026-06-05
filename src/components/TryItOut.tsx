function TryItOut() {
  return (
    <div className="tryItOutContainer">
      <div className="tryLeft">
        <p className="tryLabel">TRY IT OUT</p>

        <h2>
          Ask the question.
          <br />
          Then question
          <br />
          the answer.
        </h2>

        <div className="tryLine"></div>

        <p className="tryDescription">
          Every decision has more than one reasonable path.
          Perspective helps you slow down and see what might be shaping each one.
        </p>
      </div>

      <div className="tryCard">
        <input type="text" placeholder="What decision are you trying to make?" />

        <button>
          EXPLORE PERSPECTIVES <span>→</span>
        </button>

        <div className="tryDivider">
          <div></div>
          <span>✦</span>
          <div></div>
        </div>

        <p className="tryHint">
          The goal isn&apos;t to tell you what to think.
          It&apos;s to help you understand why different answers emerge.
        </p>
      </div>
    </div>
  );
}

export default TryItOut;