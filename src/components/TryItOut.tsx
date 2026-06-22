import { useState } from "react";

type QuestionItem = {
  type: "multiple-choice" | "text";
  question: string;
  options?: string[];
};

type MapStatus = {
  goal: "clear" | "learning" | "unclear";
  priorities: "clear" | "learning" | "unclear";
  concerns: "clear" | "learning" | "unclear";
  tradeoffs: "clear" | "learning" | "unclear";
  assumptions: "clear" | "learning" | "unclear";
};

type PerspectiveProfile = {
  values: string[];
  concerns: string[];
  tradeoffs: string[];
  regretTriggers: string[];
  assumptions: string[];
  decisionStyle: string[];
  decisionPressure: string[];
  confidenceGaps: string[];
};

type PerspectiveReport = {
  headline: string;
  whatMattersMost: string;
  holdingYouBack: string;
  tradeoff: string;
  stillUnclear: string;
  lean: string;
  why: string[];
  reflectionQuestion: string;
};

type EvidenceItem = {
  text: string;
  sourceTitle: string;
  url: string;
  tier?: "tier1" | "tier2" | "community";
};

type EvidenceResult = {
  supports: EvidenceItem[];
  challenges: EvidenceItem[];
  communityInsights: EvidenceItem[];
  missingFactors: string[];
  updatedPerspective: string;
  sources: EvidenceItem[];
};

type ConversationTurn = {
  question: string;
  answer: string;
};

const decisionMapSteps = [
  "Goal",
  "Priorities",
  "Concerns",
  "Tradeoffs",
  "Assumptions",
];

const emptyMapStatus: MapStatus = {
  goal: "unclear",
  priorities: "unclear",
  concerns: "unclear",
  tradeoffs: "unclear",
  assumptions: "unclear",
};

const emptyProfile: PerspectiveProfile = {
  values: [],
  concerns: [],
  tradeoffs: [],
  regretTriggers: [],
  assumptions: [],
  decisionStyle: [],
  decisionPressure: [],
  confidenceGaps: [],
};

function TryItOut() {
  const [question, setQuestion] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(
    null
  );
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [turn, setTurn] = useState(0);
  const [profile, setProfile] = useState<PerspectiveProfile>(emptyProfile);
  const [mapStatus, setMapStatus] = useState<MapStatus>(emptyMapStatus);
  const [report, setReport] = useState<PerspectiveReport | null>(null);
  const [evidence, setEvidence] = useState<EvidenceResult | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startInterview = async () => {
    if (!question.trim()) {
      setError("Please enter a question first.");
      return;
    }

    setLoading(true);
    setError("");
    setCurrentAnswer("");
    setConversation([]);
    setTurn(0);
    setProfile(emptyProfile);
    setMapStatus(emptyMapStatus);
    setReport(null);
    setEvidence(null);
    setInterviewComplete(false);

    try {
      const res = await fetch("http://localhost:3001/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          conversation: [],
          profile: emptyProfile,
          mapStatus: emptyMapStatus,
          turn: 0,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.question) {
        throw new Error("Invalid interview response.");
      }

      setCurrentQuestion(data.question);
      setProfile(data.profile || emptyProfile);
      setMapStatus(data.mapStatus || emptyMapStatus);
    } catch (error) {
      console.error("Error starting interview:", error);
      setError("Could not start the Perspective interview. Check your server.");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (
    finalConversation: ConversationTurn[],
    finalProfile: PerspectiveProfile,
    finalMapStatus: MapStatus
  ) => {
    try {
      const res = await fetch("http://localhost:3001/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          conversation: finalConversation,
          profile: finalProfile,
          mapStatus: finalMapStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Invalid report response.");
      }

      setReport(data);
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Could not generate the Perspective report.");
    }
  };

  const getEvidence = async () => {
    if (!report) return;

    setResearchLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/evidence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          conversation,
          profile,
          mapStatus,
          report,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Invalid evidence response.");
      }

      setEvidence(data);
    } catch (error) {
      console.error("Error getting evidence:", error);
      setError("Could not explore the evidence.");
    } finally {
      setResearchLoading(false);
    }
  };

  const continueInterview = async () => {
    if (!currentQuestion || !currentAnswer.trim()) {
      setError("Please answer the question first.");
      return;
    }

    const updatedConversation = [
      ...conversation,
      {
        question: currentQuestion.question,
        answer: currentAnswer,
      },
    ];

    const nextTurn = turn + 1;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          conversation: updatedConversation,
          profile,
          mapStatus,
          turn: nextTurn,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Invalid interview response.");
      }

      const updatedProfile = data.profile || profile;
      const updatedMapStatus = data.mapStatus || mapStatus;

      setConversation(updatedConversation);
      setProfile(updatedProfile);
      setMapStatus(updatedMapStatus);
      setTurn(nextTurn);
      setCurrentAnswer("");

      if (data.shouldContinue === false) {
        setInterviewComplete(true);
        setCurrentQuestion(null);
        await generateReport(
          updatedConversation,
          updatedProfile,
          updatedMapStatus
        );
      } else {
        setCurrentQuestion(data.question);
      }
    } catch (error) {
      console.error("Error continuing interview:", error);
      setError("Could not continue the interview. Check your server.");
    } finally {
      setLoading(false);
    }
  };

  const renderDecisionMap = () => {
    return (
      <div className="decisionMapSteps">
        {decisionMapSteps.map((step) => {
          const key = step.toLowerCase() as keyof MapStatus;
          const status = mapStatus[key];

          return (
            <span key={step} className={`mapStep ${status}`}>
              {status === "clear" ? "✓" : status === "learning" ? "~" : "○"}{" "}
              {step}
            </span>
          );
        })}
      </div>
    );
  };

  const renderSourceLink = (item: EvidenceItem) => {
    if (!item.url) return null;

    return (
      <a
        className="sourceLink"
        href={item.url}
        target="_blank"
        rel="noreferrer"
      >
        Source: {item.sourceTitle}
      </a>
    );
  };

  return (
    <section className="tryItOut" id="try">
      <div className="tryContent">
        <p className="tryLabel">TRY IT OUT</p>

        <h2>Ask the question.</h2>
        <h2>Then question the answer.</h2>

        {!currentQuestion && !interviewComplete && (
          <>
            <textarea
              className="questionInput"
              placeholder="Should I do a Math minor or Psychology minor?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            {error && <p className="tryError">{error}</p>}

            <button
              className="exploreButton"
              onClick={startInterview}
              disabled={loading}
            >
              {loading ? "THINKING..." : "BEGIN PERSPECTIVE INTERVIEW"}
            </button>
          </>
        )}

        {currentQuestion && !interviewComplete && (
          <div className="followUpSection">
            <div className="decisionMapProgress">
              <p>Perspective is building a decision map.</p>
              {renderDecisionMap()}
            </div>

            <div className="followUpCard">
              <p>{currentQuestion.question}</p>

              {currentQuestion.type === "multiple-choice" &&
                currentQuestion.options && (
                  <>
                    <div className="optionGrid">
                      {currentQuestion.options.map((option) => (
                        <button
                          key={option}
                          className={`optionButton ${
                            currentAnswer === option ||
                            currentAnswer.startsWith(`${option}:`)
                              ? "selectedOption"
                              : ""
                          }`}
                          onClick={() => setCurrentAnswer(option)}
                          type="button"
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    {(currentAnswer === "Something else" ||
                      currentAnswer.startsWith("Something else:")) && (
                      <textarea
                        className="customAnswerInput"
                        placeholder="Write your own answer..."
                        value={
                          currentAnswer.startsWith("Something else:")
                            ? currentAnswer.replace("Something else: ", "")
                            : ""
                        }
                        onChange={(e) =>
                          setCurrentAnswer(`Something else: ${e.target.value}`)
                        }
                      />
                    )}
                  </>
                )}

              {currentQuestion.type === "text" && (
                <textarea
                  placeholder="Your answer..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                />
              )}
            </div>

            {error && <p className="tryError">{error}</p>}

            <button
              className="exploreButton"
              onClick={continueInterview}
              disabled={loading}
            >
              {loading ? "THINKING..." : "CONTINUE"}
            </button>
          </div>
        )}

        {interviewComplete && (
          <div className="analysisSection">
            <div className="decisionMapProgress completeMap">
              <p>Decision map complete.</p>
              {renderDecisionMap()}
            </div>

            {!report && (
              <p className="tryError">Building your Perspective report...</p>
            )}

            {report && (
              <div className="perspectiveReport">
                <p className="reportLabel">PERSPECTIVE REPORT</p>

                <h3>{report.headline}</h3>

                <div className="reportGrid">
                  <div className="reportCard">
                    <span>🔎</span>
                    <h4>What keeps coming up</h4>
                    <p>{report.whatMattersMost}</p>
                  </div>

                  <div className="reportCard">
                    <span>↔️</span>
                    <h4>What you give up either way</h4>
                    <p>{report.holdingYouBack}</p>
                  </div>

                  <div className="reportCard">
                    <span>🧭</span>
                    <h4>The choice underneath the choice</h4>
                    <p>{report.tradeoff}</p>
                  </div>

                  <div className="reportCard">
                    <span>✓</span>
                    <h4>Before you decide</h4>
                    <p>{report.stillUnclear}</p>
                  </div>
                </div>

                <div className="leanCard">
                  <p className="leanLabel">PERSPECTIVE</p>
                  <h4>{report.lean}</h4>
                </div>

                <div className="whyCard">
                  <p className="leanLabel">WHY?</p>

                  <ul>
                    {report.why.map((item, index) => (
                      <li key={`${item}-${index}`}>✓ {item}</li>
                    ))}
                  </ul>
                </div>

                <button
                  className="otherPerspectivesButton"
                  onClick={getEvidence}
                  disabled={researchLoading}
                >
                  {researchLoading ? "RESEARCHING..." : "EXPLORE EVIDENCE"}
                </button>

                {error && <p className="tryError">{error}</p>}

                {evidence && (
                  <div className="otherPerspectivesSection">
                    <p className="reportLabel">WHAT WE FOUND</p>

                    <div className="evidenceGrid">
                      <div className="evidenceCard">
                        <h4>Why this makes sense</h4>

                        <ul>
                          {evidence.supports.map((item, index) => (
                            <li key={`support-${index}`}>
                              <span>{item.text}</span>
                              {renderSourceLink(item)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="evidenceCard">
                        <h4>Reasons to question it</h4>

                        <ul>
                          {evidence.challenges.map((item, index) => (
                            <li key={`challenge-${index}`}>
                              <span>{item.text}</span>
                              {renderSourceLink(item)}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="evidenceCard">
                        <h4>Community perspectives</h4>

                        {evidence.communityInsights.length > 0 ? (
                          <ul>
                            {evidence.communityInsights.map((item, index) => (
                              <li key={`community-${index}`}>
                                <span>{item.text}</span>
                                {renderSourceLink(item)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>
                            We could not find strong community discussion for
                            this decision yet.
                          </p>
                        )}
                      </div>

                      <div className="evidenceCard">
                        <h4>What else matters</h4>

                        <ul>
                          {evidence.missingFactors.map((item, index) => (
                            <li key={`missing-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="updatedEvidenceCard">
                        <h4>Updated Perspective</h4>
                        <p>{evidence.updatedPerspective}</p>
                      </div>
                    </div>

                    {evidence.sources.length > 0 && (
                      <div className="sourcesConsulted">
                        <h4>Sources consulted</h4>

                        <div className="sourcePills">
                          {evidence.sources.map((source, index) => (
                            <a
                              key={`source-${index}`}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.sourceTitle}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default TryItOut;