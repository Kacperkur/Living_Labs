"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import ResultPanel from "@/components/ResultPanel";
import MemberBlock from "@/components/MemberBlock";
import { SearchResult } from "@/types";


export default function LivingLabPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lab, setLab] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<SearchResult[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [members, setMembers] = useState<{ name: string; profile_picture_url: string | null }[]>([]);
  const [building, setBuilding] = useState<string | null>(null);

  const transformLabToSearchResult = useCallback((lab: any): SearchResult => ({
    id: lab.id || "",
    title: lab.name || "Unnamed Lab",
    author: lab.location || null,
    content_url: null,
    lab_id: lab.id || "",
    lab_name: lab.name || "Unnamed Lab",
    published: null,
    score: 1.0,
    collection: "media",
    metadata: {
      biography: lab.biography || "",
      end_date: lab.end_date || null,
      start_date: lab.start_date || null,
      SDGs: lab.SDGs || [],
      location: lab.location || "",
    },
  }), []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchLabInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const labId = searchParams.get("id");
        if (!labId) throw new Error("Lab ID not provided");

        const encoded = encodeURIComponent(labId);

        // Fetch lab details and media in parallel — they're independent of each other.
        // lab-details replaces the previous 3 sequential calls (fetch-lab-info,
        // lab-members, lab-location) with one combined server-side call.
        const [labRes, mediaRes] = await Promise.all([
          fetch(`/api/lab-details?id=${encoded}`, { signal: controller.signal }),
          fetch(`/api/media-by-lab?id=${encoded}`, { signal: controller.signal }),
        ]);

        if (!labRes.ok) {
          const errorData = await labRes.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${labRes.status}: Failed to fetch lab info`);
        }

        const labData = await labRes.json();
        if (!labData) throw new Error("No lab information available");

        if (isMounted) {
          setLab(transformLabToSearchResult(labData));
          setMembers(labData.members ?? []);
          setBuilding(labData.building ?? null);
        }

        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          if (isMounted) setMedia(mediaData.media ?? []);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Fetch failed:", err);
          if (isMounted) setError(err.message || "An unexpected error occurred");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLabInfo();
    return () => { isMounted = false; controller.abort(); };
  }, [searchParams, transformLabToSearchResult]);

  const handleSearchResults = useCallback((matches: SearchResult[], query: string) => {
    router.push(`/?q=${encodeURIComponent(query)}`);
  }, [router]);

  const sdgs: any[] = lab?.metadata?.SDGs ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <header className="header-container">
        <div className="header-top-row">
          <a href="/" className="logo-section" style={{ textDecoration: "none", color: "inherit" }}>
            <img className="header-logo" src="/logo.jpg" alt="Logo" />
            <h1 className="header-title">Living Labs</h1>
          </a>
          <div className="search-bar-wrapper">
            <SearchBar onResults={handleSearchResults} />
          </div>
          <div className="nav-links">
            <a href="/our-labs" style={{ textDecoration: 'none' }}><h2>Our Labs</h2></a>
            <a href="/join" style={{ textDecoration: 'none' }}><h2>Join</h2></a>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#fff" }}>
        {isLoading ? (
          <div style={{ padding: "30px" }}>
            {/* Hero row: image + info */}
            <div style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>
              <div className="skeleton-shimmer" style={{ width: 598, height: 350, flexShrink: 0, borderRadius: 6 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
                <div className="skeleton-shimmer" style={{ height: 52, width: "75%" }} />
                <div className="skeleton-shimmer" style={{ height: 28, width: "50%" }} />
                <div className="skeleton-shimmer" style={{ height: 22, width: "40%" }} />
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  {[0, 1, 2].map(i => <div key={i} className="skeleton-shimmer" style={{ width: 80, height: 80, borderRadius: 4 }} />)}
                </div>
              </div>
            </div>
            {/* Synopsis */}
            <div style={{ padding: "24px 0 8px" }}>
              <div className="skeleton-shimmer" style={{ height: 36, width: 140, marginBottom: 12 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skeleton-shimmer" style={{ height: 22, width: "100%" }} />
                <div className="skeleton-shimmer" style={{ height: 22, width: "95%" }} />
                <div className="skeleton-shimmer" style={{ height: 22, width: "80%" }} />
              </div>
            </div>
            {/* Members */}
            <div style={{ marginTop: 24 }}>
              <div className="skeleton-shimmer" style={{ height: 36, width: 120, margin: "0 auto 16px" }} />
              <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div className="skeleton-shimmer" style={{ width: 80, height: 80, borderRadius: "50%" }} />
                    <div className="skeleton-shimmer" style={{ height: 14, width: 70 }} />
                  </div>
                ))}
              </div>
            </div>
            {/* Media */}
            <div style={{ marginTop: 32 }}>
              <div className="skeleton-shimmer" style={{ height: 36, width: 180, margin: "0 auto 16px" }} />
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: "flex", gap: 16, padding: 16, background: "var(--background-clr-400)", borderBottom: "1px solid #eee", marginBottom: 8 }}>
                  <div className="skeleton-shimmer" style={{ width: 160, height: 100, flexShrink: 0, borderRadius: 6 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className="skeleton-shimmer" style={{ height: 24, width: "60%" }} />
                    <div className="skeleton-shimmer" style={{ height: 14, width: "40%" }} />
                    <div className="skeleton-shimmer" style={{ height: 14, width: "30%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "Onest, sans-serif", fontSize: 18, color: "#d32f2f", gap: 8 }}>
            <div>Error: {error}</div>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "8px 16px", background: "var(--primary-clr-300)", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
            >
              Retry
            </button>
          </div>
        ) : lab ? (
          <div style={{ padding: "30px" }}>

            {/* ── Identification Info ── */}
            <div style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>
              <img
                src={`/lab_images/${building}.jpg`}
                alt={lab.lab_name || "Lab"}
                onError={(e) => { (e.target as HTMLImageElement).style.background = "#c8d8e8"; (e.target as HTMLImageElement).removeAttribute("src"); }}
                style={{ width: 598, height: 350, objectFit: "cover", flexShrink: 0, backgroundColor: "#c8d8e8" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 700, fontSize: 48, color: "#002147", margin: 0, lineHeight: 1 }}>
                  {lab.lab_name}
                </p>
                {lab.metadata?.location && (
                  <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 24, color: "#002147", margin: 0, lineHeight: 1 }}>
                    {lab.metadata.location}
                  </p>
                )}
                {lab.metadata?.start_date && (
                  <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 24, color: "#000", margin: 0, lineHeight: 1 }}>
                    {formatDate(lab.metadata.start_date as string)}
                    {lab.metadata?.end_date && lab.metadata.end_date !== lab.metadata.start_date
                      ? ` – ${formatDate(lab.metadata.end_date as string)}`
                      : " – Present"}
                  </p>
                )}

                {/* ── SDGs (Metrics / Goals) ── */}
                {sdgs.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 18, color: "#000", margin: "0 0 8px 0", lineHeight: 1 }}>
                      Sustainable Development Goals
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      {sdgs.map((sdg: any, i: number) => {
                        const SDG_NAME_TO_NUMBER: Record<string, number> = {
                          "No Poverty": 1,
                          "Zero Hunger": 2,
                          "Good Health and Well-Being": 3,
                          "Quality Education": 4,
                          "Gender Equality": 5,
                          "Clean Water and Sanitation": 6,
                          "Affordable and Clean Energy": 7,
                          "Decent Work and Economic Growth": 8,
                          "Industry, Innovation, and Infrastructure": 9,
                          "Reduced Inequalities": 10,
                          "Sustainable Cities and Communities": 11,
                          "Responsible Consumption and Production": 12,
                          "Climate Action": 13,
                          "Life Below Water": 14,
                          "Life on Land": 15,
                          "Peace, Justice, and Strong Institutions": 16,
                          "Partnerships for the Goals": 17,
                        };
                        const name = typeof sdg === "string" ? sdg : (sdg?.name || sdg?.content_url || "");
                        const num = SDG_NAME_TO_NUMBER[name];
                        if (!num) return null;
                        const imagePath = `/SDG_pngs/E-WEB-Goal-${String(num).padStart(2, "0")}.png`;
                        return (
                          <img
                            key={i}
                            src={imagePath}
                            alt={name}
                            title={name}
                            style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 4, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const div = document.createElement("div");
                              div.style.cssText = "padding: 8px 12px; background: #f5f5f5; border-radius: 4px; font-family: Onest, sans-serif; font-size: 12px; color: #002147; border: 1px solid #ddd;";
                              div.textContent = name;
                              target.parentNode?.replaceChild(div, target);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Synopsis ── */}
            {lab.metadata?.biography && (
              <div style={{ padding: "16px 0" }}>
                <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 36, color: "#000", margin: "0 0 6px 0", lineHeight: 1 }}>
                  Synopsis
                </p>
                <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 24, color: "#000", margin: 0, lineHeight: 1.4 }}>
                  {lab.metadata.biography}
                </p>
              </div>
            )}

            {/* ── Members ── */}
            {members.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 36, color: "#000", textAlign: "center", margin: "0 0 16px 0" }}>
                  Members
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
                  {members.map((member, i) => (
                    <MemberBlock
                      key={i}
                      name={member.name}
                      profilePictureUrl={member.profile_picture_url}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Published Media ── */}
            <div style={{ marginTop: 24 }}>
              <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 36, color: "#000", textAlign: "center", margin: "0 0 8px 0" }}>
                Published Media
              </p>
              {media.length === 0 ? (
                <p style={{ fontFamily: "Onest, sans-serif", fontSize: 14, color: "#888", textAlign: "center", marginTop: 16 }}>
                  No published media found for this lab.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {media.map((item) => (
                    <ResultPanel
                      key={item.id}
                      result={item}
                      selectedId={selectedMediaId}
                      onSelect={setSelectedMediaId}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "Onest, sans-serif", fontSize: 18, color: "#666" }}>
            No lab information found
          </div>
        )}
      </div>
    </div>
  );
}
