"use client";

import { useState } from "react";
import Header from "@/components/Header";

export default function SuggestionBoxPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        let errorMsg = "Something went wrong. Please try again.";
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
        } catch {
          // response wasn't JSON — likely a server error
        }
        throw new Error(errorMsg);
      }

      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #dde1e7",
    borderRadius: 8,
    fontFamily: "Onest, sans-serif",
    fontSize: 15,
    color: "var(--tertiary-clr-100)",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

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

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "64px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          {/* Heading */}
          <h1
            style={{
              fontFamily: "Quantico, sans-serif",
              fontSize: 48,
              fontWeight: 400,
              color: "var(--tertiary-clr-100)",
              margin: "0 0 8px",
            }}
          >
            Suggestion Box
          </h1>
          <p
            style={{
              fontFamily: "Onest, sans-serif",
              fontSize: 16,
              color: "#6b7e96",
              margin: "0 0 40px",
              lineHeight: 1.6,
            }}
          >
            Have an idea, feedback, or anything you'd like to share? I read every message.
          </p>

          {status === "sent" ? (
            <div
              style={{
                padding: "32px",
                background: "#fff",
                border: "1px solid #dde1e7",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Quantico, sans-serif",
                  fontSize: 24,
                  color: "var(--primary-clr-300)",
                  margin: "0 0 8px",
                }}
              >
                Message sent!
              </p>
              <p
                style={{
                  fontFamily: "Onest, sans-serif",
                  fontSize: 15,
                  color: "#6b7e96",
                  margin: "0 0 24px",
                }}
              >
                Thanks for the suggestion. I appreciate it.
              </p>
              <button
                onClick={() => setStatus("idle")}
                style={{
                  padding: "10px 28px",
                  background: "var(--primary-clr-300)",
                  color: "white",
                  fontFamily: "Onest, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 24,
                  cursor: "pointer",
                }}
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "Onest, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--tertiary-clr-100)",
                    marginBottom: 6,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  Name <span style={{ color: "#a0aec0", fontWeight: 400, textTransform: "none" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "Onest, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--tertiary-clr-100)",
                    marginBottom: 6,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  Email <span style={{ color: "#a0aec0", fontWeight: 400, textTransform: "none" }}>(optional — if you'd like a reply)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={inputStyle}
                />
              </div>

              {/* Message */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: "Onest, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--tertiary-clr-100)",
                    marginBottom: 6,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  placeholder="Share your suggestion, idea, or feedback..."
                  required
                  rows={6}
                  maxLength={1000}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
                <p
                  style={{
                    fontFamily: "Onest, sans-serif",
                    fontSize: 12,
                    color: message.length >= 1000 ? "#E74C3C" : "#a0aec0",
                    margin: "4px 0 0",
                    textAlign: "right",
                  }}
                >
                  {message.length}/1000
                </p>
              </div>

              {status === "error" && (
                <p
                  style={{
                    fontFamily: "Onest, sans-serif",
                    fontSize: 14,
                    color: "#E74C3C",
                    margin: 0,
                  }}
                >
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !message.trim()}
                style={{
                  alignSelf: "flex-start",
                  padding: "14px 36px",
                  background:
                    status === "sending" || !message.trim()
                      ? "#a0aec0"
                      : "var(--primary-clr-300)",
                  color: "white",
                  fontFamily: "Onest, sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 28,
                  cursor: status === "sending" || !message.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (status !== "sending" && message.trim())
                    (e.currentTarget as HTMLElement).style.background = "var(--secondary-clr-200)";
                }}
                onMouseLeave={(e) => {
                  if (status !== "sending" && message.trim())
                    (e.currentTarget as HTMLElement).style.background = "var(--primary-clr-300)";
                }}
              >
                {status === "sending" ? "Sending..." : "Send Suggestion"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
