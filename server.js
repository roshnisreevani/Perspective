import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();
console.log("Tavily key loaded:", !!process.env.TAVILY_API_KEY);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const MIN_TURNS = 6;
const MAX_TURNS = 10;

const defaultMapStatus = {
  goal: "unclear",
  priorities: "unclear",
  concerns: "unclear",
  tradeoffs: "unclear",
  assumptions: "unclear",
};

async function askOllama(prompt) {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.1",
      prompt,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.response;
}

function extractJSON(text) {
  const firstBrace = text.indexOf("{");

  if (firstBrace === -1) {
    throw new Error("No JSON found in model response.");
  }

  let depth = 0;

  for (let i = firstBrace; i < text.length; i++) {
    const char = text[i];

    if (char === "{") depth++;
    if (char === "}") depth--;

    if (depth === 0) {
      const jsonString = text.slice(firstBrace, i + 1);
      return JSON.parse(jsonString);
    }
  }

  throw new Error("Could not find complete JSON object.");
}

function emptyProfile() {
  return {
    values: [],
    concerns: [],
    tradeoffs: [],
    regretTriggers: [],
    assumptions: [],
    decisionStyle: [],
    decisionPressure: [],
    confidenceGaps: [],
  };
}

function normalizeMapStatus(mapStatus = {}) {
  const allowed = ["clear", "learning", "unclear"];

  return {
    goal: allowed.includes(mapStatus.goal) ? mapStatus.goal : "unclear",
    priorities: allowed.includes(mapStatus.priorities)
      ? mapStatus.priorities
      : "unclear",
    concerns: allowed.includes(mapStatus.concerns)
      ? mapStatus.concerns
      : "unclear",
    tradeoffs: allowed.includes(mapStatus.tradeoffs)
      ? mapStatus.tradeoffs
      : "unclear",
    assumptions: allowed.includes(mapStatus.assumptions)
      ? mapStatus.assumptions
      : "unclear",
  };
}

function shouldContinueInterview(turn, mapStatus) {
  const completedTurns = turn;

  if (completedTurns < MIN_TURNS) return true;
  if (completedTurns >= MAX_TURNS) return false;

  const statuses = Object.values(mapStatus);
  const allClear = statuses.every((status) => status === "clear");

  return !allClear;
}

function classifySource(url = "") {
  const lower = url.toLowerCase();

  if (
    lower.includes(".gov") ||
    lower.includes(".edu") ||
    lower.includes("nih.gov") ||
    lower.includes("who.int") ||
    lower.includes("bls.gov") ||
    lower.includes("stanford.edu") ||
    lower.includes("mckinsey.com") ||
    lower.includes("oecd.org") ||
    lower.includes("worldbank.org")
  ) {
    return "tier1";
  }

  if (
    lower.includes("reddit.com") ||
    lower.includes("news.ycombinator.com") ||
    lower.includes("stackoverflow.com") ||
    lower.includes("quora.com")
  ) {
    return "community";
  }

  return "tier2";
}

function buildResearchQuery(question, report) {
  return `
${question}
${report?.lean || ""}
credible articles research data statistics report university government source
-reddit -forum -quora
`.trim();
}

function buildCommunityQuery(question) {
  return `
${question}
site:reddit.com OR forum community experiences opinions discussion
`.trim();
}

async function tavilySearch(query, maxResults = 6) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error("Missing TAVILY_API_KEY in your .env file.");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: false,
      include_raw_content: true,
    }),
  });

  if (!response.ok) {
    throw new Error("Tavily search failed.");
  }

  const data = await response.json();

  if (!Array.isArray(data.results)) {
    return [];
  }

  return data.results
    .filter((item) => item.url && item.title)
    .map((item) => ({
      title: item.title,
      url: item.url,
      content: item.raw_content || item.content || "",
      tier: classifySource(item.url),
    }));
}

async function searchWebForEvidence(question, report) {
  const researchSources = await tavilySearch(
    buildResearchQuery(question, report),
    6
  );

  const communitySources = await tavilySearch(buildCommunityQuery(question), 4);

  return [...researchSources, ...communitySources];
}

function cleanEvidenceItem(item, sources, fallbackTier = "tier2") {
  const matchedSource = sources.find((source) => source.url === item?.url);

  if (!matchedSource) {
    return null;
  }

  return {
    text: item?.text || "This source adds context to the decision.",
    sourceTitle: matchedSource.title,
    url: matchedSource.url,
    tier: matchedSource.tier || fallbackTier,
  };
}

app.post("/api/interview", async (req, res) => {
  try {
    const {
      question,
      conversation = [],
      profile = emptyProfile(),
      mapStatus = defaultMapStatus,
      turn = 0,
    } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    const text = await askOllama(`
You are Perspective, an AI decision-analysis tool.

Your job is NOT to give a recommendation yet.
Your job is to understand the person making the decision.

The user asked:
"${question}"

Conversation so far:
${JSON.stringify(conversation, null, 2)}

Current Perspective Profile:
${JSON.stringify(profile, null, 2)}

Current Decision Map Status:
${JSON.stringify(mapStatus, null, 2)}

Current turn number:
${turn}

You are building a decision map with these areas:
- goal
- priorities
- concerns
- tradeoffs
- assumptions

Decision map statuses can only be:
- clear
- learning
- unclear

Important interview behavior:
- Do NOT move through the map in a fixed order.
- Do NOT ask one question per category.
- After every answer, update the mapStatus.
- Ask the next question about the most important unclear or learning area.
- If the user's answer is mixed, vague, or conflicted, stay in that area and ask a sharper follow-up.
- Each question must build on the user's previous answer.
- Make each question simple, specific, and human.
- Do not give a recommendation yet.

Question style:
- Ask only ONE next question.
- Use multiple-choice when the user needs options.
- Use text when explanation is needed.
- Multiple-choice questions must have exactly 5 options.
- The fifth option must always be "Something else".

Interview depth:
- Cover each decision-map area at least once.
- Stop only when the map is clear enough and at least 6 questions have been asked.
- Never ask more than 10 questions total.

Profile update rules:
- Update the profile based on the full conversation.
- Keep profile items short.
- Avoid duplicates.
- Use everyday language.

Return ONLY valid JSON with this exact structure:
{
  "question": {
    "type": "multiple-choice",
    "question": "",
    "options": ["", "", "", "", "Something else"]
  },
  "detectedSignal": {
    "category": "",
    "label": "",
    "reason": ""
  },
  "profile": {
    "values": [],
    "concerns": [],
    "tradeoffs": [],
    "regretTriggers": [],
    "assumptions": [],
    "decisionStyle": [],
    "decisionPressure": [],
    "confidenceGaps": []
  },
  "mapStatus": {
    "goal": "unclear",
    "priorities": "unclear",
    "concerns": "unclear",
    "tradeoffs": "unclear",
    "assumptions": "unclear"
  },
  "shouldContinue": true
}
`);

const result = extractJSON(text);
    const cleanMapStatus = normalizeMapStatus(result.mapStatus);
    const forcedShouldContinue = shouldContinueInterview(turn, cleanMapStatus);

    res.json({
      question: result.question || {
        type: "text",
        question: "What are you hoping to get out of this decision?",
      },
      detectedSignal: result.detectedSignal || {
        category: "confidenceGaps",
        label: "unclear signal",
        reason: "Perspective needs more information.",
      },
      profile: {
        ...emptyProfile(),
        ...(result.profile || {}),
      },
      mapStatus: cleanMapStatus,
      shouldContinue: forcedShouldContinue,
    });
  } catch (error) {
    console.error("Perspective interview failed:");
    console.error(error);

    res.status(500).json({
      error: "Perspective interview failed.",
    });
  }
});

app.post("/api/report", async (req, res) => {
  try {
    const { question, conversation, profile, mapStatus } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    const text = await askOllama(`
You are Perspective, a decision-analysis tool.

Create a final report that helps the user make the decision, not just summarize what they said.

Original decision:
"${question}"

Conversation:
${JSON.stringify(conversation || [], null, 2)}

Profile:
${JSON.stringify(profile || emptyProfile(), null, 2)}

Decision map status:
${JSON.stringify(mapStatus || defaultMapStatus, null, 2)}

Rules:
- Sound human, specific, and grounded.
- Use plain language.
- Do not sound academic, dramatic, corporate, motivational, or generic.
- Give a clear lean, but do not act like there is one objective right answer.
- Do not mention internal profile categories.
- Do not use the words "evidence", "assumptions", "values", or "bias".
- Never mention information that was not in the conversation.
- The headline should be a clear conclusion.
- The lean should name the option Perspective leans toward when possible.
- Each card field must be 3 lines max.
- Each card field should help the user make the decision.
- Each card field should tell the user how to think about the choice, not just repeat what they said.
- Be specific to the user's decision.
- Avoid filler like "Perspective is unsure", "it depends on your priorities", or "there are pros and cons."

Write the four card fields like this:
- whatMattersMost: "What matters" — the main thing the user seems to be choosing for.
- holdingYouBack: "What you're sacrificing" — what the user loses or gives up with each option.
- tradeoff: "What the decision is really asking" — the simpler question underneath the choice.
- stillUnclear: "What to verify before deciding" — one concrete thing the user should check before trusting the recommendation.

Return ONLY valid JSON:
{
  "headline": "",
  "whatMattersMost": "",
  "holdingYouBack": "",
  "tradeoff": "",
  "stillUnclear": "",
  "lean": "",
  "why": ["", "", ""],
  "reflectionQuestion": ""
}
`);

    const report = extractJSON(text);

    res.json({
      headline:
        report.headline ||
        "This choice depends on what you want the option to do for you.",
      whatMattersMost:
        report.whatMattersMost ||
        "The strongest signal is what you want this choice to protect. Pick the option that best supports that goal.",
      holdingYouBack:
        report.holdingYouBack ||
        "You give something up either way. The better choice is the one where that loss feels easier to accept.",
      tradeoff:
        report.tradeoff ||
        "The real question is not which option is perfect. It is which option creates the future you are more willing to work toward.",
      stillUnclear:
        report.stillUnclear ||
        "Before deciding, check the one outside factor that could change the answer. If that points clearly one way, trust that direction more.",
      lean:
        report.lean ||
        "Perspective would lean toward the option that best protects your longer-term goals.",
      why:
        Array.isArray(report.why) && report.why.length > 0
          ? report.why.slice(0, 3)
          : [
              "Your answers pointed toward preparation, not just interest.",
              "The stronger option is the one that keeps more future paths open.",
              "The final choice should match what your target programs or roles actually value.",
            ],
      reflectionQuestion:
        report.reflectionQuestion ||
        "What outside fact would make this decision easier?",
    });
  } catch (error) {
    console.error("Report generation failed:");
    console.error(error);

    res.status(500).json({
      error: "Report generation failed.",
    });
  }
});
function fillToTwo(items, fallbackSource, fallbackText) {
  const filled = [...items];

  while (filled.length < 2 && fallbackSource) {
    filled.push({
      text: fallbackText,
      sourceTitle: fallbackSource.title,
      url: fallbackSource.url,
      tier: fallbackSource.tier,
    });
  }

  return filled.slice(0, 2);
}

app.post("/api/evidence", async (req, res) => {
  try {
    const { question, conversation, profile, mapStatus, report } = req.body;

    if (!question || !report) {
      return res.status(400).json({
        error: "Question and report are required.",
      });
    }

    const sources = await searchWebForEvidence(question, report);

    if (sources.length === 0) {
      return res.status(500).json({
        error: "No research sources were found.",
      });
    }

    const text = await askOllama(`
You are Perspective's research analyst.

The user already received a Perspective Report.
Now use the research sources below to test and refine the recommendation.

Original decision:
"${question}"

Conversation:
${JSON.stringify(conversation || [], null, 2)}

Profile:
${JSON.stringify(profile || emptyProfile(), null, 2)}

Decision map:
${JSON.stringify(mapStatus || defaultMapStatus, null, 2)}

Perspective report:
${JSON.stringify(report, null, 2)}

Research sources:
${sources
  .map(
    (source, index) => `
SOURCE ${index + 1}
Title: ${source.title}
URL: ${source.url}
Tier: ${source.tier}
Content:
${source.content.slice(0, 2200)}
`
  )
  .join("\n")}

Your job:
1. Check whether outside sources support the recommendation.
2. Check whether outside sources make the recommendation weaker.
3. Keep Reddit/forums only in communityInsights.
4. Point out practical things the user should check before deciding.
5. Write a short updated perspective.
6. Use the kind of language someone would naturally say out loud in a conversation.

Rules:
- Use ONLY the provided sources.
- Return ONLY valid JSON.
- Use the exact source title and exact URL from the provided source list.
- Do not invent sources, links, or statistics.
- Use simple language a normal person would understand.
- No academic wording.
- No vague filler.

Source rules:
- supports must use only tier1 or tier2 sources.
- challenges must use only tier1 or tier2 sources.
- communityInsights must use only community sources.
- Never use Reddit/forums in supports or challenges.

Amount:
- Return exactly 2 support items when possible.
- Return exactly 2 challenge items when possible.
- Return exactly 1 or 2 community insight items when possible.
- Each item should be 2 short sentences.

Writing style:
- Sentence 1: what the source says.
- Sentence 2: why that matters for this decision.
- Write like you are explaining it to a friend.
- Avoid words like: implications, facilitate, optimize, utilize, stakeholders, limitations, interdisciplinary, computational complexity.
- Avoid phrases like: "it depends", "there are pros and cons", "further research is needed", "this may be beneficial".

Section meaning:
- supports: article/research points that make the recommendation stronger.
- challenges: article/research points that make the user pause or double-check.
- communityInsights: what real people say from Reddit/forums only.
- missingFactors: practical things the user should check before deciding.
- updatedPerspective: 2 sentences max. Say whether the outside sources strengthened, weakened, or slightly changed the recommendation.


Return this exact JSON structure:
{
  "supports": [
    {
      "text": "",
      "sourceTitle": "",
      "url": "",
      "tier": "tier1"
    }
  ],
  "challenges": [
    {
      "text": "",
      "sourceTitle": "",
      "url": "",
      "tier": "tier2"
    }
  ],
  "communityInsights": [
    {
      "text": "",
      "sourceTitle": "",
      "url": "",
      "tier": "community"
    }
  ],
  "missingFactors": [
    "",
    "",
    ""
  ],
  "updatedPerspective": ""
}
`);

    let result;

try {
  result = extractJSON(text);
} catch (error) {
  console.log("RAW EVIDENCE RESPONSE:", text);

  result = {
    supports: [],
    challenges: [],
    communityInsights: [],
    missingFactors: [
      "The outside sources were not clear enough to fully settle the decision.",
      "The exact requirements or real-world constraints should still be checked.",
      "Community opinions may vary depending on personal goals.",
    ],
    updatedPerspective:
      "The original recommendation still seems reasonable, but the research step could not produce a clean source-backed update this time.",
  };
}

    const supports = Array.isArray(result.supports)
      ? result.supports
          .map((item) => cleanEvidenceItem(item, sources))
          .filter(Boolean)
          .slice(0, 2)
      : [];

    const challenges = Array.isArray(result.challenges)
      ? result.challenges
          .map((item) => cleanEvidenceItem(item, sources))
          .filter(Boolean)
          .slice(0, 2)
      : [];

    const communityInsights = Array.isArray(result.communityInsights)
      ? result.communityInsights
          .map((item) => cleanEvidenceItem(item, sources, "community"))
          .filter(Boolean)
          .slice(0, 2)
      : [];

    
    const researchSourcesOnly = sources.filter(
  (source) => source.tier !== "community"
);

const communitySourcesOnly = sources.filter(
  (source) => source.tier === "community"
);

const fallbackResearchSource = researchSourcesOnly[0] || sources[0];
const fallbackCommunitySource = communitySourcesOnly[0];

    res.json({
      
        supports: fillToTwo(
  supports,
  fallbackResearchSource,
  "This source supports the recommendation from a different angle."
),

challenges: fillToTwo(
  challenges,
  fallbackResearchSource,
  "This source highlights a limitation that should be considered."
),

communityInsights: fillToTwo(
  communityInsights,
  fallbackCommunitySource,
  "People discussing similar decisions often mention this in practice."
),

      missingFactors:
        Array.isArray(result.missingFactors) &&
        result.missingFactors.length > 0
          ? result.missingFactors.slice(0, 3)
          : [
              "The exact outside requirements were not compared.",
              "The time cost was not fully explored.",
              "The strongest alternative path was not tested against this choice.",
            ],

      updatedPerspective:
        result.updatedPerspective ||
        "The original perspective still seems reasonable, but outside research adds important tradeoffs.",

      sources: sources.map((source) => ({
        sourceTitle: source.title,
        url: source.url,
        tier: source.tier,
      })),
    });
  } catch (error) {
    console.error("Evidence generation failed:");
    console.error(error);

    res.status(500).json({
      error:
        "Evidence generation failed. Check your Tavily API key and server logs.",
    });
  }
});

app.post("/api/questions", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    const text = await askOllama(`
You are Perspective, an AI decision-analysis tool.

A user is making this decision:
"${question}"

Generate exactly 3 simple but deeply thoughtful follow-up prompts.

Return ONLY valid JSON with this exact structure:
{
  "questions": [
    {
      "type": "multiple-choice",
      "question": "",
      "options": ["", "", "", "", "Something else"]
    },
    {
      "type": "multiple-choice",
      "question": "",
      "options": ["", "", "", "", "Something else"]
    },
    {
      "type": "text",
      "question": ""
    }
  ]
}
`);

    let result;

try {
  result = extractJSON(text);
} catch (error) {
  console.log("RAW EVIDENCE RESPONSE:", text);

  result = {
    supports: [],
    challenges: [],
    communityInsights: [],
    missingFactors: [
      "The sources were not clear enough to fully settle the decision.",
      "Check the real requirements, costs, or constraints before deciding.",
      "Community opinions may differ depending on the person's goals.",
    ],
    updatedPerspective:
      "The original recommendation still seems reasonable, but the research summary did not come through cleanly this time.",
  };
}
    res.json(result);
  } catch (error) {
    console.error("Question generation failed:");
    console.error(error);

    res.status(500).json({
      error: "Question generation failed.",
    });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { question, answers, profile } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    const text = await askOllama(`
You are Perspective, an AI decision-analysis tool.

Analyze the user's decision using:
1. Original question
2. Follow-up answers
3. Perspective profile

Original decision:
"${question}"

Follow-up answers:
${JSON.stringify(answers || [], null, 2)}

Perspective profile:
${JSON.stringify(profile || emptyProfile(), null, 2)}

Return ONLY valid JSON with these exact keys:
{
  "evidence": "",
  "assumptions": "",
  "values": "",
  "bias": "",
  "alternativePerspective": ""
}
`);

    const analysis = extractJSON(text);
    res.json(analysis);
  } catch (error) {
    console.error("AI analysis failed:");
    console.error(error);

    res.status(500).json({
      error: "AI analysis failed.",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Perspective server running with Ollama on http://localhost:${PORT}`
  );
});