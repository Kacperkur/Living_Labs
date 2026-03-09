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

  const transformLabToSearchResult = useCallback((lab: any): SearchResult => ({
    id: lab.id || "",
    title: lab.name || "Unnamed Lab",
    author: lab.location || null,
    content_url: null,
    lab_id: lab.id || "",
    lab_name: lab.name || "Unnamed Lab",
    start_date: lab.start_date || null,
    end_date: lab.end_date || null,
    score: 1.0,
    authors: lab.location ? [lab.location] : [],
    collection: "lab",
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

        const response = await fetch(`/api/fetch-lab-info?id=${encodeURIComponent(labId)}`, {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch lab info`);
        }

        const data = await response.json();
        if (!data) throw new Error("No lab information available");

        const transformed = transformLabToSearchResult(data);
        if (isMounted) setLab(transformed);

        // Fetch media for this lab
        const mediaRes = await fetch(`/api/media-by-lab?id=${encodeURIComponent(labId)}`, { signal: controller.signal });
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          if (isMounted) setMedia(mediaData.media ?? []);
        }

        // Fetch members for this lab
        const membersRes = await fetch(`/api/lab-members?id=${encodeURIComponent(labId)}`, { signal: controller.signal });
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          if (isMounted) setMembers(membersData.members ?? []);
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
            <h2>Our Labs</h2>
            <h2>Join</h2>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#fff" }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: "Onest, sans-serif", fontSize: 18, color: "#666" }}>
            Loading lab information...
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
                src={`/lab_images/${lab.metadata?.location}.jpg`}
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
                {lab.start_date && (
                  <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 24, color: "#000", margin: 0, lineHeight: 1 }}>
                    {formatDate(lab.start_date)}
                    {lab.end_date && lab.end_date !== lab.start_date
                      ? ` – ${formatDate(lab.end_date)}`
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
                        let filename: string | null = null;
                        if (typeof sdg === "string") {
                          filename = sdg;
                        } else if (typeof sdg === "object" && sdg !== null) {
                          filename = sdg.content_url || sdg.name || null;
                        }
                        if (!filename) return null;
                        if (!filename.includes(".png") && !filename.includes(".jpg") && !filename.includes(".jpeg")) {
                          filename = `${filename}.png`;
                        }
                        const imagePath = `/sdg_pngs/${filename}`;
                        return (
                          <img
                            key={i}
                            src={imagePath}
                            alt={`SDG ${filename}`}
                            title={`SDG ${filename}`}
                            style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 4, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const div = document.createElement("div");
                              div.style.cssText = "padding: 8px 12px; background: #f5f5f5; border-radius: 4px; font-family: Onest, sans-serif; font-size: 12px; color: #002147; border: 1px solid #ddd;";
                              div.textContent = filename;
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
