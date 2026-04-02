"use client";

import Header from "@/components/Header";

const MEDIA_EXAMPLES = [
  {
    type: "YouTube Video",
    description: "Student documentaries, lab walkthroughs, project demos, or recorded presentations hosted on YouTube.",
    embedUrl: "https://www.youtube.com/embed/pFVdF7ZKBto",
    linkUrl: "https://youtu.be/pFVdF7ZKBto",
    icon: "▶",
    color: "#FF0000",
  },
  {
    type: "Research Paper",
    description: "Published or unpublished papers, theses, and academic write-ups documenting your lab's findings.",
    embedUrl: "https://docs.google.com/viewer?url=https://digitalcommons.uri.edu/cgi/viewcontent.cgi%3Farticle%3D1037%26context%3Denre_facpubs&embedded=true",
    linkUrl: "https://digitalcommons.uri.edu/cgi/viewcontent.cgi?article=1037&context=enre_facpubs",
    icon: "📄",
    color: "var(--primary-clr-300)",
  },
  {
    type: "Presentation / Slides",
    description: "PowerPoints, Google Slides, or PDFs from conference talks, class presentations, or internal reviews.",
    embedUrl: "https://docs.google.com/viewer?url=https://web.uri.edu/wp-content/uploads/sites/1601/Substainability-Strategic-Plan-2018_Proof5.pdf&embedded=true",
    linkUrl: "https://web.uri.edu/wp-content/uploads/sites/1601/Substainability-Strategic-Plan-2018_Proof5.pdf",
    icon: "📊",
    color: "var(--secondary-clr-200)",
  },
  {
    type: "Project Site / Link",
    description: "Live demos, GitHub repos, portfolio sites, or any external link that showcases your work in action.",
    embedUrl: "https://brennan-infused.github.io/",
    linkUrl: "https://brennan-infused.github.io/",
    icon: "🔗",
    color: "var(--tertiary-clr-100)",
  },
];

const SECTIONS = [
  {
    heading: "Who are we for?",
    side: "left" as const,
    body: "Living Labs is built for three core groups. For student organizations and research initiatives, it provides a platform to publish work, gain visibility, and attract funding and partnerships. For students, graduates, and researchers, it centralizes research, papers, and project outcomes from URI—making it easier to explore ideas, collaborate across disciplines, and build on existing work. For corporations and external partners, it offers access to active labs and research groups that can serve as real-world sandboxes for testing, prototyping, and co-developing new ideas.",
  },
  {
    heading: "How we help",
    side: "right" as const,
    body: "We provide a platform that makes it easy for organizations to share research, findings, and outcomes while increasing their visibility. At the same time, students can access these resources to support their studies, and graduate researchers can draw inspiration from interdisciplinary work, uncovering connections across fields working on similar problems. By linking work to its physical and academic origins, users can go beyond reading—visiting the labs where it was developed and directly connecting with authors to ask questions, collaborate, and deepen their understanding.",
  },
  {
    heading: "Why a beta?",
    side: "left" as const,
    body: "I am running a beta in order to test the desirability of this kind of site, as well as incorporating suggestions that I get through feedback to make this platform something you want to use. I encourage any leader to reach out to me through the Join page on the header, in order to get a link to access the creation of your own lab.",
  },
];

export default function AboutPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background-clr-400)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <div
          style={{
            padding: "64px 80px 48px",
            borderBottom: "1px solid #e2e4e7",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "Quantico, sans-serif",
              fontSize: 56,
              fontWeight: 400,
              color: "var(--tertiary-clr-100)",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Living Labs
          </h1>
          <p
            style={{
              fontFamily: "Onest, sans-serif",
              fontSize: 20,
              color: "#6b7e96",
              marginTop: 16,
              maxWidth: 640,
              lineHeight: 1.6,
            }}
          >
            A platform connecting URI's research labs, students, and partners—making academic work visible, accessible, and actionable.
          </p>
        </div>

        {/* Q&A Sections */}
        {SECTIONS.map(({ heading, side, body }) => (
          <div
            key={heading}
            style={{
              display: "flex",
              flexDirection: side === "left" ? "row" : "row-reverse",
              alignItems: "flex-start",
              gap: 0,
              borderBottom: "1px solid #e2e4e7",
            }}
          >
            {/* Heading column */}
            <div
              style={{
                flex: "0 0 320px",
                padding: "64px 48px",
                borderRight: side === "left" ? "1px solid #e2e4e7" : "none",
                borderLeft: side === "right" ? "1px solid #e2e4e7" : "none",
              }}
            >
              <h2
                style={{
                  fontFamily: "Quantico, sans-serif",
                  fontSize: 40,
                  fontWeight: 400,
                  color: "var(--tertiary-clr-100)",
                  margin: 0,
                  lineHeight: 1.2,
                  textAlign: side,
                }}
              >
                {heading}
              </h2>
            </div>

            {/* Body column */}
            <div
              style={{
                flex: 1,
                padding: "64px 64px",
              }}
            >
              <p
                style={{
                  fontFamily: "Onest, sans-serif",
                  fontSize: 18,
                  color: "#6b7e96",
                  margin: 0,
                  lineHeight: 1.7,
                  maxWidth: 680,
                }}
              >
                {body}
              </p>
            </div>
          </div>
        ))}

        {/* What should I post? */}
        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "flex-start",
            gap: 0,
            borderBottom: "1px solid #e2e4e7",
          }}
        >
          {/* Heading column */}
          <div
            style={{
              flex: "0 0 320px",
              padding: "64px 48px",
              borderLeft: "1px solid #e2e4e7",
            }}
          >
            <h2
              style={{
                fontFamily: "Quantico, sans-serif",
                fontSize: 40,
                fontWeight: 400,
                color: "var(--tertiary-clr-100)",
                margin: 0,
                lineHeight: 1.2,
                textAlign: "right",
              }}
            >
              What should I post?
            </h2>
          </div>

          {/* Media cards column */}
          <div style={{ flex: 1, padding: "48px 64px", display: "flex", flexDirection: "row", gap: 24 }}>
            {MEDIA_EXAMPLES.map((item) => (
              <div
                key={item.type}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                {/* Type label above preview */}
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 20,
                    background: item.color,
                    color: "white",
                    fontFamily: "Onest, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    whiteSpace: "nowrap",
                    marginBottom: 10,
                  }}
                >
                  {item.type}
                </span>

                {/* Thumbnail */}
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "100%",
                    aspectRatio: "16/10",
                    background: "#e8edf2",
                    border: "1px solid #dde1e7",
                    borderRadius: 8,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                    textDecoration: "none",
                  }}
                >
                  <iframe
                    src={item.embedUrl}
                    style={{
                      width: "100%",
                      height: "calc(100% + 44px)",
                      border: 0,
                      pointerEvents: "none",
                      position: "absolute",
                      top: -44,
                      left: 0,
                    }}
                    title={item.type}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    sandbox="allow-scripts allow-same-origin"
                  />
                  {/* Transparent overlay so clicks go to the <a> not the iframe */}
                  <div style={{ position: "absolute", inset: 0 }} />
                </a>

                {/* Description below preview */}
                <p
                  style={{
                    fontFamily: "Onest, sans-serif",
                    fontSize: 13,
                    color: "#6b7e96",
                    margin: "10px 0 0",
                    lineHeight: 1.6,
                  }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div
          style={{
            padding: "64px 80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "Quantico, sans-serif",
              fontSize: 36,
              fontWeight: 400,
              color: "var(--tertiary-clr-100)",
              margin: 0,
            }}
          >
            Ready to join the beta?
          </h2>
          <p
            style={{
              fontFamily: "Onest, sans-serif",
              fontSize: 16,
              color: "#6b7e96",
              margin: 0,
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Reach out through the Join page to get access and start sharing your lab's work.
          </p>
          <a
            href="/join"
            style={{
              marginTop: 8,
              padding: "14px 36px",
              background: "var(--primary-clr-300)",
              color: "white",
              fontFamily: "Onest, sans-serif",
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 28,
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--secondary-clr-200)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--primary-clr-300)")}
          >
            Join the Beta
          </a>
        </div>
      </main>
    </div>
  );
}
