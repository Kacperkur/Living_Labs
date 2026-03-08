"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { SearchResult } from "@/types";

function BookmarkButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={active ? "Remove bookmark" : "Bookmark"}
      style={{
        width: 33,
        height: 36,
        borderRadius: "50%",
        backgroundColor: active ? "#002147" : "#e0e0e0",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background-color 0.2s",
      }}
    >
      <svg
        width="14"
        height="16"
        viewBox="0 0 14 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* + icon */}
        <line x1="7" y1="3" x2="7" y2="9" stroke={active ? "#fff" : "#002147"} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="6" x2="10" y2="6" stroke={active ? "#fff" : "#002147"} strokeWidth="1.5" strokeLinecap="round" />
        {/* bookmark bottom chevron lines */}
        <line x1="3" y1="4" x2="5" y2="2.5" stroke={active ? "#fff" : "#002147"} strokeWidth="1" strokeLinecap="round" />
        <line x1="3" y1="6" x2="5" y2="7.5" stroke={active ? "#fff" : "#002147"} strokeWidth="1" strokeLinecap="round" />
        <line x1="11" y1="4" x2="9" y2="2.5" stroke={active ? "#fff" : "#002147"} strokeWidth="1" strokeLinecap="round" />
        <line x1="11" y1="6" x2="9" y2="7.5" stroke={active ? "#fff" : "#002147"} strokeWidth="1" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export default function LivingLabPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lab, setLab] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

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

  const toggleBookmark = (id: string) =>
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const sdgs: any[] = lab?.metadata?.SDGs ?? [];

  const publications = lab
    ? [
        {
          id: "pub-1",
          title: "Monitoring Impacts of the Gulf Stream and its Rings on the Physics, Chemistry, and Biology of the Middle Atlantic Bight Shelf and Slope from CMV Oleander",
          authors: "Andres, M., Rossby, T., Firing, E., Flagg, C., Bates, N.R., Hummon, J.M., Pierrot, D., Noyes, T.J., Enright, M.P., O'Brien, J.K., Hudak, J., Dong, S., Melrose, D.C., Johns, D.G., Gregory, L.",
          publishedDate: "January 6, 2025",
        },
        {
          id: "pub-2",
          title: "Monitoring Impacts of the Gulf Stream and its Rings on the Physics, Chemistry, and Biology of the Middle Atlantic Bight Shelf and Slope from CMV Oleander",
          authors: "Andres, M., Rossby, T., Firing, E., Flagg, C., Bates, N.R., Hummon, J.M., Pierrot, D., Noyes, T.J., Enright, M.P., O'Brien, J.K., Hudak, J., Dong, S., Melrose, D.C., Johns, D.G., Gregory, L.",
          publishedDate: "January 6, 2025",
        },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <header className="header-container">
        <div className="header-top-row">
          <div className="logo-section">
            <img className="header-logo" src="/logo.jpg" alt="Logo" />
            <h1 className="header-title">Living Labs</h1>
          </div>
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

            {/* ── SDGs (Metrics / Goals) ── */}
            {sdgs.length > 0 && (
              <div style={{ padding: "16px 0" }}>
                <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 36, color: "#000", margin: "0 0 10px 0", lineHeight: 1 }}>
                  Sustainable Development Goals
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {sdgs.map((sdg: any, i: number) => (
                    <p key={i} style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 24, color: "#000", margin: 0, lineHeight: 1.4 }}>
                      {typeof sdg === "string" ? sdg : sdg.name ?? JSON.stringify(sdg)}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* ── Published Media ── */}
            <div style={{ marginTop: 8 }}>
              <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 400, fontSize: 36, color: "#000", textAlign: "center", margin: "0 0 8px 0" }}>
                Published Media
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {publications.map((pub) => (
                  <div
                    key={pub.id}
                    style={{
                      backgroundColor: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "44px 30px",
                      maxHeight: 300,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 736, color: "#002147" }}>
                      <p style={{ fontFamily: "Onest, sans-serif", fontWeight: 700, fontSize: 24, color: "#002147", margin: 0, lineHeight: "normal" }}>
                        {pub.title}
                      </p>
                      <p style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, fontSize: 9, color: "#002147", margin: 0 }}>
                        {pub.authors}
                      </p>
                      <p style={{ fontFamily: "Roboto, sans-serif", fontWeight: 300, fontSize: 9, color: "#002147", margin: 0 }}>
                        Published Online: {pub.publishedDate}
                      </p>
                    </div>
                    <BookmarkButton
                      active={bookmarks.has(pub.id)}
                      onClick={() => toggleBookmark(pub.id)}
                    />
                  </div>
                ))}
              </div>
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
