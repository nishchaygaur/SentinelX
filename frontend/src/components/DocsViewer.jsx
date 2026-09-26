import { useState, useMemo, useEffect, useRef } from "react";
import {
  Shield,
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Menu,
  X,
  FileText,
  ExternalLink,
  BookOpen,
  Wrench,
  Server,
  Layout,
  Database,
  ArrowDownToLine,
  Cloud,
  CheckCircle,
  ShieldCheck,
  Terminal,
  Workflow,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { docsData } from "../docsData";
import "./DocsViewer.css";

// Map category icons
const CATEGORY_ICONS = {
  Overview: BookOpen,
  "Setup & Installation": Wrench,
  "Backend Architecture": Server,
  "Frontend Architecture": Layout,
  "Database & Schema": Database,
  "Log Ingestion": ArrowDownToLine,
  "Cloud Deployment": Cloud,
  "Testing & Quality": CheckCircle,
  "Security & Hardening": ShieldCheck,
  "Operations & Runbooks": Terminal,
  "Architecture Diagrams": Workflow,
  "Reference & Standards": FileText
};

/**
 * Lightweight, robust Markdown Parser Component for React
 */
function MarkdownRenderer({ content, onHeadingRendered }) {
  const blocks = useMemo(() => {
    if (!content) return [];
    const lines = content.split("\n");
    const parsedBlocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Code blocks (```language ... ```)
      if (line.trim().startsWith("```")) {
        const lang = line.trim().slice(3).trim() || "text";
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        parsedBlocks.push({
          type: "code",
          lang,
          code: codeLines.join("\n")
        });
        i++;
        continue;
      }

      // 2. Tables (| col | col |)
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          const headerRow = tableLines[0]
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());
          // line 1 is separator |---|---|
          const bodyRows = tableLines.slice(2).map((r) =>
            r
              .split("|")
              .slice(1, -1)
              .map((c) => c.trim())
          );
          parsedBlocks.push({
            type: "table",
            headers: headerRow,
            rows: bodyRows
          });
          continue;
        }
      }

      // 3. Blockquotes & Callouts (> [!NOTE] or > text)
      if (line.trim().startsWith(">")) {
        const quoteLines = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
          i++;
        }
        const fullText = quoteLines.join("\n");
        let calloutType = "default";
        let textContent = fullText;

        if (fullText.startsWith("[!NOTE]")) {
          calloutType = "note";
          textContent = fullText.replace("[!NOTE]", "").trim();
        } else if (fullText.startsWith("[!WARNING]")) {
          calloutType = "warning";
          textContent = fullText.replace("[!WARNING]", "").trim();
        } else if (fullText.startsWith("[!IMPORTANT]")) {
          calloutType = "important";
          textContent = fullText.replace("[!IMPORTANT]", "").trim();
        } else if (fullText.startsWith("[!TIP]")) {
          calloutType = "note";
          textContent = fullText.replace("[!TIP]", "").trim();
        }

        parsedBlocks.push({
          type: "callout",
          calloutType,
          text: textContent
        });
        continue;
      }

      // 4. Headings (#, ##, ###, ####)
      const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const text = hMatch[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        parsedBlocks.push({
          type: "heading",
          level,
          text,
          id
        });
        i++;
        continue;
      }

      // 5. Horizontal rule (--- or ***)
      if (/^(\*\*\*|---|___)$/.test(line.trim())) {
        parsedBlocks.push({ type: "hr" });
        i++;
        continue;
      }

      // 6. Lists (- item, * item, 1. item)
      if (/^(\s*[-*]|\s*\d+\.)\s+/.test(line)) {
        const listItems = [];
        const isOrdered = /^\s*\d+\.\s+/.test(line);
        while (
          i < lines.length &&
          (/^(\s*[-*]|\s*\d+\.)\s+/.test(lines[i]) || (lines[i].startsWith("   ") && listItems.length > 0))
        ) {
          if (/^(\s*[-*]|\s*\d+\.)\s+/.test(lines[i])) {
            listItems.push(lines[i].replace(/^(\s*[-*]|\s*\d+\.)\s+/, "").trim());
          } else {
            listItems[listItems.length - 1] += " " + lines[i].trim();
          }
          i++;
        }
        parsedBlocks.push({
          type: isOrdered ? "ol" : "ul",
          items: listItems
        });
        continue;
      }

      // 7. Regular Paragraphs
      if (line.trim().length > 0) {
        const pLines = [line.trim()];
        i++;
        while (
          i < lines.length &&
          lines[i].trim().length > 0 &&
          !lines[i].trim().startsWith("#") &&
          !lines[i].trim().startsWith("```") &&
          !lines[i].trim().startsWith(">") &&
          !lines[i].trim().startsWith("|") &&
          !/^(\s*[-*]|\s*\d+\.)\s+/.test(lines[i])
        ) {
          pLines.push(lines[i].trim());
          i++;
        }
        parsedBlocks.push({
          type: "p",
          text: pLines.join(" ")
        });
        continue;
      }

      i++;
    }

    return parsedBlocks;
  }, [content]);

  // Extract headings for Table of Contents
  useEffect(() => {
    if (onHeadingRendered) {
      const headings = blocks
        .filter((b) => b.type === "heading" && (b.level === 2 || b.level === 3))
        .map((b) => ({ text: b.text, id: b.id, level: b.level }));
      onHeadingRendered(headings);
    }
  }, [blocks, onHeadingRendered]);

  // Helper to format inline elements (bold, code, links)
  const formatInline = (text) => {
    if (!text) return "";
    // Break into tokens for `code`, **bold**, *italic*, [link](url)
    const tokens = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline Code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        tokens.push(<code key={keyIdx++}>{codeMatch[1]}</code>);
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold: **bold**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        tokens.push(<strong key={keyIdx++}>{formatInline(boldMatch[1])}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic: *italic* or _italic_
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        tokens.push(<em key={keyIdx++}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Link: [label](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const isExternal = linkMatch[2].startsWith("http");
        tokens.push(
          <a
            key={keyIdx++}
            href={linkMatch[2]}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            style={{ color: "#818cf8", textDecoration: "underline" }}
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Regular character
      const nextSpecial = remaining.search(/[`*[]/);
      if (nextSpecial === -1) {
        tokens.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        tokens.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        tokens.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return tokens;
  };

  return (
    <div className="docs-rendered-markdown">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          const Tag = `h${block.level}`;
          return (
            <Tag key={idx} id={block.id}>
              {formatInline(block.text)}
            </Tag>
          );
        }

        if (block.type === "p") {
          return <p key={idx}>{formatInline(block.text)}</p>;
        }

        if (block.type === "code") {
          return <CodeBlock key={idx} lang={block.lang} code={block.code} />;
        }

        if (block.type === "table") {
          return (
            <div key={idx} className="docs-table-wrapper">
              <table>
                <thead>
                  <tr>
                    {block.headers.map((h, hIdx) => (
                      <th key={hIdx}>{formatInline(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{formatInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "callout") {
          return (
            <div key={idx} className={`docs-callout ${block.calloutType}`}>
              <div>{formatInline(block.text)}</div>
            </div>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={idx}>
              {block.items.map((it, iIdx) => (
                <li key={iIdx}>{formatInline(it)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={idx}>
              {block.items.map((it, iIdx) => (
                <li key={iIdx}>{formatInline(it)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "hr") {
          return <hr key={idx} className="docs-hr" />;
        }

        return null;
      })}
    </div>
  );
}

/**
 * Fenced Code Block with Copy Button
 */
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="docs-code-block">
      <div className="docs-code-header">
        <span>{lang}</span>
        <button
          type="button"
          className="docs-copy-btn"
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={13} color="#10b981" />
              <span style={{ color: "#10b981" }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * SentinelX Dedicated Full-Browser Documentation Explorer
 */
export default function DocsViewer({ onNavigateHome, initialDocId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocId, setSelectedDocId] = useState(initialDocId || "README");
  const [activeHeadings, setActiveHeadings] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [copiedPath, setCopiedPath] = useState(false);
  const contentContainerRef = useRef(null);

  // Group all documents by category
  const categoriesMap = useMemo(() => {
    const map = {};
    for (const doc of docsData) {
      if (!map[doc.category]) {
        map[doc.category] = [];
      }
      map[doc.category].push(doc);
    }
    return map;
  }, []);

  // Filtered documents when searching
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return docsData.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.path.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Current active document
  const currentDoc = useMemo(() => {
    return (
      docsData.find((d) => d.id === selectedDocId || d.path === selectedDocId) ||
      docsData[0]
    );
  }, [selectedDocId]);

  // Index of current doc for Prev / Next navigation
  const currentIndex = useMemo(() => {
    return docsData.findIndex((d) => d.id === currentDoc.id);
  }, [currentDoc]);

  const prevDoc = currentIndex > 0 ? docsData[currentIndex - 1] : null;
  const nextDoc = currentIndex < docsData.length - 1 ? docsData[currentIndex + 1] : null;

  // Handle URL synchronisation with history API
  const selectDocument = (docId) => {
    setSelectedDocId(docId);
    setMobileMenuOpen(false);
    // Update browser URL query/hash without full reload
    const url = new URL(window.location.href);
    url.searchParams.set("doc", docId);
    window.history.pushState({ docId }, "", url.toString());

    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Listen to popstate for browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const docParam = params.get("doc");
      if (docParam) {
        setSelectedDocId(docParam);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Estimate reading time in minutes
  const readingTime = useMemo(() => {
    if (!currentDoc?.content) return "1 min";
    const words = currentDoc.content.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }, [currentDoc]);

  const toggleCategory = (catName) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(`docs/${currentDoc.path}`);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleScrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="docs-layout">
      {/* ---------------- Topbar Header ---------------- */}
      <header className="docs-header">
        <div className="docs-header-left">
          <button
            type="button"
            className="docs-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="docs-brand" onClick={() => selectDocument("README")}>
            <div className="docs-logo-icon">
              <Shield size={18} />
            </div>
            <div className="docs-brand-title">
              <span>SentinelX</span>
              <span className="docs-pill-badge">DOCS</span>
            </div>
          </div>
        </div>

        <div className="docs-header-center">
          <div className="docs-search-box">
            <Search className="docs-search-icon" size={15} />
            <input
              type="text"
              className="docs-search-input"
              placeholder="Search all 82 platform docs, APIs, rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="docs-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="docs-header-right">
          <button
            type="button"
            className="docs-btn-console"
            onClick={onNavigateHome}
            title="Return to SentinelX SOC Console"
          >
            <ArrowLeft size={15} />
            <span>Open SOC Console</span>
          </button>

          <a
            href="https://github.com/nishchaygaur/SentinelX"
            target="_blank"
            rel="noopener noreferrer"
            className="docs-btn-secondary"
            title="View SentinelX on GitHub"
          >
            <span>GitHub</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
      </header>

      {/* ---------------- Main Body Layout ---------------- */}
      <div className="docs-body">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="docs-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ---------------- Left Navigation Sidebar ---------------- */}
        <aside className={`docs-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
          {searchResults ? (
            <div className="docs-category-group">
              <div className="docs-category-title">
                <span>Search Results ({searchResults.length})</span>
              </div>
              <div className="docs-nav-items">
                {searchResults.length === 0 ? (
                  <div style={{ padding: "12px", color: "#64748b", fontSize: "0.8rem" }}>
                    No documentation matched "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((doc) => (
                    <div
                      key={doc.id}
                      className={`docs-nav-link ${doc.id === currentDoc.id ? "active" : ""}`}
                      onClick={() => selectDocument(doc.id)}
                    >
                      <span>{doc.title}</span>
                      <ChevronRight size={12} style={{ opacity: 0.5 }} />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            Object.entries(categoriesMap).map(([categoryName, docList]) => {
              const Icon = CATEGORY_ICONS[categoryName] || FileText;
              const isCollapsed = collapsedCategories[categoryName];

              return (
                <div key={categoryName} className="docs-category-group">
                  <div
                    className="docs-category-title"
                    onClick={() => toggleCategory(categoryName)}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icon size={14} style={{ color: "#818cf8" }} />
                      {categoryName}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span className="docs-category-count">{docList.length}</span>
                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </span>
                  </div>

                  {!isCollapsed && (
                    <div className="docs-nav-items">
                      {docList.map((doc) => (
                        <div
                          key={doc.id}
                          className={`docs-nav-link ${doc.id === currentDoc.id ? "active" : ""}`}
                          onClick={() => selectDocument(doc.id)}
                          title={doc.title}
                        >
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {doc.title}
                          </span>
                          {doc.id === currentDoc.id && (
                            <ChevronRight size={13} style={{ color: "#6366f1", flexShrink: 0 }} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </aside>

        {/* ---------------- Center Reading Pane ---------------- */}
        <main className="docs-content-container" ref={contentContainerRef}>
          <article className="docs-article">
            {/* Breadcrumbs */}
            <div className="docs-breadcrumbs">
              <span style={{ cursor: "pointer" }} onClick={() => selectDocument("README")}>
                Docs
              </span>
              <span className="docs-breadcrumb-separator">/</span>
              <span className="docs-breadcrumb-item">{currentDoc.category}</span>
              <span className="docs-breadcrumb-separator">/</span>
              <span>{currentDoc.title}</span>
            </div>

            {/* Article Hero Header */}
            <div className="docs-article-header">
              <div className="docs-article-badge-row">
                <span className="docs-badge-cat">{currentDoc.category}</span>
                <span className="docs-badge-time">
                  <Clock size={12} />
                  {readingTime}
                </span>
              </div>

              <h1 className="docs-article-title">{currentDoc.title}</h1>

              <div className="docs-article-meta-bar">
                <span className="docs-file-path">docs/{currentDoc.path}</span>

                <div className="docs-article-actions">
                  <button
                    type="button"
                    className="docs-action-btn"
                    onClick={handleCopyPath}
                    title="Copy relative file path"
                  >
                    {copiedPath ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copiedPath ? "Copied" : "Copy Path"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rendered Markdown Body */}
            <MarkdownRenderer
              content={currentDoc.content}
              onHeadingRendered={setActiveHeadings}
            />

            {/* Previous / Next Article Navigation Footer */}
            <div className="docs-article-nav">
              {prevDoc ? (
                <div
                  className="docs-nav-card prev"
                  onClick={() => selectDocument(prevDoc.id)}
                >
                  <span className="docs-nav-card-label">&larr; Previous</span>
                  <span className="docs-nav-card-title">{prevDoc.title}</span>
                </div>
              ) : (
                <div style={{ flex: 1 }} />
              )}

              {nextDoc ? (
                <div
                  className="docs-nav-card next"
                  onClick={() => selectDocument(nextDoc.id)}
                >
                  <span className="docs-nav-card-label">Next &rarr;</span>
                  <span className="docs-nav-card-title">{nextDoc.title}</span>
                </div>
              ) : (
                <div style={{ flex: 1 }} />
              )}
            </div>
          </article>
        </main>

        {/* ---------------- Right-Hand "On this page" TOC (Desktop) ---------------- */}
        <aside className="docs-toc">
          <div className="docs-toc-title">On this page</div>
          {activeHeadings.length === 0 ? (
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Overview</div>
          ) : (
            <ul className="docs-toc-links">
              {activeHeadings.slice(0, 15).map((h, hIdx) => (
                <li key={hIdx}>
                  <div
                    className="docs-toc-link"
                    style={{ paddingLeft: h.level === 3 ? "10px" : "0px" }}
                    onClick={() => handleScrollToHeading(h.id)}
                  >
                    {h.text}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="docs-toc-quicklinks">
            <div className="docs-toc-title">Quick Resources</div>
            <a
              href="https://github.com/nishchaygaur/SentinelX"
              target="_blank"
              rel="noopener noreferrer"
              className="docs-quick-item"
            >
              <ExternalLink size={12} />
              <span>GitHub Repository</span>
            </a>
            <a
              href="#docs/backend/API_ENDPOINTS"
              onClick={(e) => {
                e.preventDefault();
                selectDocument("backend/API_ENDPOINTS");
              }}
              className="docs-quick-item"
            >
              <Server size={12} />
              <span>API Endpoints Reference</span>
            </a>
            <a
              href="#docs/setup/DEVELOPMENT_SETUP"
              onClick={(e) => {
                e.preventDefault();
                selectDocument("setup/DEVELOPMENT_SETUP");
              }}
              className="docs-quick-item"
            >
              <Wrench size={12} />
              <span>Local Development Setup</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
