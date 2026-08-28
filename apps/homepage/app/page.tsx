const capabilities = [
  {
    title: "Interpretive state",
    description:
      "Turn vague user language into explicit application state that can be inspected, corrected, and reused."
  },
  {
    title: "SUP architecture",
    description:
      "Separate state, updating, and presentation so AI interactions stay composable as your product surface grows."
  },
  {
    title: "Generative UI",
    description:
      "Drive interfaces from structured state instead of brittle strings or hand-built prompt branches."
  }
];

const workflow = [
  "Capture what the user means, not just what they typed.",
  "Resolve ambiguity through state formation and selective follow-up.",
  "Render dependable product behavior across agents, forms, and UI."
];

const proofPoints = [
  "Documentation-first architecture",
  "Patterns for evaluation and reliability",
  "Designed for teams shipping production AI"
];

export default function HomePage() {
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.langstate.com";

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Stateful AI systems, made practical</p>
          <h1>Build AI products that reason through state instead of guessing from text.</h1>
          <p className="lead">
            LangState gives teams a design language for structuring intent,
            clarifying ambiguity, and turning AI interactions into reliable
            product behavior.
          </p>
          <div className="actions">
            <a className="button button-primary" href={docsUrl}>
              Explore the docs
            </a>
            <a className="button button-secondary" href="mailto:hi@langstate.com">
              Talk to LangState
            </a>
          </div>
        </div>

        <div className="signal-card">
          <span className="signal-label">Why teams adopt it</span>
          <ul>
            {proofPoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid-section">
        {capabilities.map((item) => (
          <article className="feature-card" key={item.title}>
            <p className="feature-kicker">Core capability</p>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="story-section">
        <div>
          <p className="eyebrow">How it works</p>
          <h2>From messy conversation to dependable software behavior.</h2>
        </div>

        <ol className="workflow">
          {workflow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="closing-panel">
        <p className="eyebrow">Start with the architecture</p>
        <h2>The docs stay separate. The product story gets its own homepage.</h2>
        <p>
          This repository now supports both flows: Mintlify for technical
          documentation and Next.js for the public-facing homepage.
        </p>
        <a className="text-link" href={docsUrl}>
          Open documentation
        </a>
      </section>
    </main>
  );
}
