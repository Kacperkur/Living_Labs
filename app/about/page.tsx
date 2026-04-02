"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";

const LAB_COMPONENTS = [
  {
    id: "idea",
    label: "Idea",
    color: "#E74C3C",
    icon: "https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/key-lab-components%2Fidea.png?alt=media&token=d410e45b-559c-407b-9e2a-45b865e60668",
    body: "Every Living Lab begins with a clearly defined problem or opportunity grounded in real campus or community needs. These ideas are shaped by curiosity, research, and a drive to test solutions in a real-world environment.",
    angle: 0,
  },
  {
    id: "location",
    label: "Location",
    color: "#E67E22",
    icon: "https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/key-lab-components%2Flocation.png?alt=media&token=11b3b777-5bbe-4128-a4f7-557ba214c4ae",
    body: "The campus serves as a dynamic test bed where ideas are implemented, observed, and refined in context. Each project is tied to a specific physical space, allowing users to see where the work happens and engage with it directly.",
    angle: 60,
  },
  {
    id: "partners",
    label: "Partners",
    color: "#F1C40F",
    icon: "https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/key-lab-components%2Fpartnerships.png?alt=media&token=c803832f-3e2d-4332-868b-f3300ebe584c",
    body: "Living Labs are supported by a network of students, faculty, and external collaborators who bring diverse expertise. These partnerships ensure continuity, credibility, and access to resources beyond student turnover.",
    angle: 120,
  },
  {
    id: "data",
    label: "Data Collection",
    color: "#2ECC71",
    icon: "https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/key-lab-components%2Fdata%20collection.png?alt=media&token=d1678641-f0ef-43da-b953-a58adcecb100",
    body: "Projects continuously gather data in formats best suited to their goals, from quantitative measurements to qualitative observations. This ongoing collection ensures that insights are grounded in real evidence and evolving conditions.",
    angle: 180,
  },
  {
    id: "outreach",
    label: "Outreach",
    color: "#3498DB",
    icon: "https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/key-lab-components%2Foutreach.png?alt=media&token=e18c1ea4-271e-4e62-9648-268267e5e86a",
    body: "Findings and progress are shared through the platform and other media to increase visibility and engagement. Outreach connects projects with new audiences, potential collaborators, and funding opportunities.",
    angle: 240,
  },
  {
    id: "outcome",
    label: "Outcome",
    color: "#002147",
    icon: "https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/key-lab-components%2Foutcomes.png?alt=media&token=300c9c29-58bf-4c6e-a9ec-e12dbb82058d",
    body: "Outcomes represent the tangible results of experimentation, including prototypes, reports, and implemented solutions. They demonstrate how collected data and tested ideas translate into real impact.",
    angle: 300,
  },
];

const FEEDBACK_LOOP = {
  id: "feedback",
  label: "Feedback Loop",
  color: "#9B59B6",
  icon: "https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/key-lab-components%2Ffeedback%20loop.png?alt=media&token=c46c5f6f-63c6-4338-938c-c5daa57fa074",
  body: "Each project operates within a continuous feedback loop where data, outcomes, and user input inform the next iteration. This cycle enables teams to refine their work, adapt to new insights, and sustain long-term innovation through direct engagement with their audience and collaborators.",
};

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

// Radius and card size for the hexagonal layout
const RADIUS = 165;
const CARD_SIZE = 110;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function LabCard({
  label,
  color,
  icon,
  selected,
  onClick,
  style,
}: {
  label: string;
  color: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: CARD_SIZE,
        height: CARD_SIZE,
        borderRadius: 16,
        background: color,
        border: selected ? "3px solid #fff" : "3px solid transparent",
        boxShadow: selected
          ? `0 0 0 3px ${color}, 0 8px 32px rgba(0,0,0,0.22)`
          : "0 4px 16px rgba(0,0,0,0.13)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 12,
        transition: "transform 0.2s, box-shadow 0.2s",
        transform: selected ? "scale(1.08)" : "scale(1)",
        position: "absolute",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.transform = "scale(1)";
      }}
    >
      <img src={icon} alt={label} style={{ width: 40, height: 40, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
      <span
        style={{
          fontFamily: "Onest, sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: "white",
          textAlign: "center",
          lineHeight: 1.2,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function AboutPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(false);

  // 900px is roughly where carousel + text start to overflow side-by-side
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const allCards = [...LAB_COMPONENTS, FEEDBACK_LOOP];
  const activeCard = allCards.find((c) => c.id === selected) ?? null;

  const containerSize = RADIUS * 2 + CARD_SIZE + 20;
  const center = containerSize / 2;

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
            padding: narrow ? "32px 24px" : "32px 80px",
            borderBottom: "1px solid #e2e4e7",
            display: "flex",
            flexDirection: narrow ? "column" : "row",
            alignItems: narrow ? "center" : "center",
            gap: 48,
          }}
        >
          {/* Left — carousel */}
          <div style={{ flexShrink: 0 }}>
          {/* Hexagonal carousel */}
          <div
            style={{
              position: "relative",
              width: containerSize,
              height: containerSize,
            }}
          >
            {/* Outer 6 cards */}
            {LAB_COMPONENTS.map((card) => {
              const rad = toRad(card.angle - 90);
              const x = center + RADIUS * Math.cos(rad) - CARD_SIZE / 2;
              const y = center + RADIUS * Math.sin(rad) - CARD_SIZE / 2;
              return (
                <LabCard
                  key={card.id}
                  label={card.label}
                  color={card.color}
                  icon={card.icon}
                  selected={selected === card.id}
                  onClick={() => setSelected(selected === card.id ? null : card.id)}
                  style={{ left: x, top: y }}
                />
              );
            })}

            {/* Center — Feedback Loop */}
            <LabCard
              label={FEEDBACK_LOOP.label}
              color={FEEDBACK_LOOP.color}
              icon={FEEDBACK_LOOP.icon}
              selected={selected === FEEDBACK_LOOP.id}
              onClick={() => setSelected(selected === FEEDBACK_LOOP.id ? null : FEEDBACK_LOOP.id)}
              style={{ left: center - CARD_SIZE / 2, top: center - CARD_SIZE / 2 }}
            />
          </div>
          </div>

          {/* Right — title + description */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: narrow ? "center" : "flex-start", textAlign: narrow ? "center" : "left" }}>
            <h1
              style={{
                fontFamily: "Quantico, sans-serif",
                fontSize: 56,
                fontWeight: 400,
                color: "var(--tertiary-clr-100)",
                margin: "0 0 16px",
                lineHeight: 1.1,
              }}
            >
              Living Labs
            </h1>
            <div style={{ transition: "opacity 0.2s", minHeight: 100 }}>
              {activeCard ? (
                <>
                  <h3
                    style={{
                      fontFamily: "Quantico, sans-serif",
                      fontSize: 22,
                      fontWeight: 400,
                      color: activeCard.color === "#F1C40F" ? "#b8860b" : activeCard.color,
                      margin: "0 0 8px",
                    }}
                  >
                    {activeCard.label}
                  </h3>
                  <p
                    style={{
                      fontFamily: "Onest, sans-serif",
                      fontSize: 18,
                      color: "#6b7e96",
                      margin: 0,
                      lineHeight: 1.7,
                    }}
                  >
                    {activeCard.body}
                  </p>
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontFamily: "Onest, sans-serif",
                      fontSize: 20,
                      color: "#6b7e96",
                      margin: "0 0 12px",
                      lineHeight: 1.6,
                    }}
                  >
                    A platform connecting URI's research labs, students, and partners—making academic work visible, accessible, and actionable.
                  </p>
                  <p style={{ fontFamily: "Onest, sans-serif", fontSize: 13, color: "#a0aec0", margin: 0 }}>
                    Click any card to learn more
                  </p>
                </>
              )}
            </div>
          </div>

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
