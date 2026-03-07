import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

// ── Colors ────────────────────────────────────────────────────────
const C = {
  BLUE: "1F4E79",
  DARK: "1B1B1B",
  GRAY: "4A4A4A",
  WHITE: "FFFFFF",
  GREEN: "27AE60",
  AMBER: "F39C12",
  RED: "E74C3C",
  LIGHT_BLUE: "D6E4F0",
} as const;

function statusColor(status: string): string {
  if (status === "PASS") return C.GREEN;
  if (status === "WARN") return C.AMBER;
  return C.RED;
}

// ── Helpers ───────────────────────────────────────────────────────

function run(text: string, opts: { bold?: boolean; color?: string; size?: number } = {}): TextRun {
  return new TextRun({
    text,
    bold: opts.bold,
    color: opts.color ?? C.DARK,
    size: opts.size ?? 22, // 11pt in half-points
    font: "Arial",
  });
}

function para(
  text: string,
  opts: {
    bold?: boolean;
    color?: string;
    size?: number;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    pageBreakBefore?: boolean;
    spacingAfter?: number;
  } = {}
): Paragraph {
  return new Paragraph({
    heading: opts.heading,
    alignment: opts.alignment,
    pageBreakBefore: opts.pageBreakBefore,
    spacing: { after: opts.spacingAfter ?? 100 },
    children: [run(text, { bold: opts.bold, color: opts.color, size: opts.size })],
  });
}

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: { fill: C.BLUE, type: ShadingType.CLEAR, color: "auto" },
    borders: allBorders("CCCCCC"),
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [run(text, { bold: true, color: C.WHITE, size: 20 })],
      }),
    ],
  });
}

function cell(
  text: string,
  opts: {
    bold?: boolean;
    color?: string;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    shading?: string;
    width?: number;
    size?: number;
  } = {}
): TableCell {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR, color: "auto" } : undefined,
    borders: allBorders("E5E7EB"),
    children: [
      new Paragraph({
        alignment: opts.alignment,
        spacing: { before: 40, after: 40 },
        children: [
          run(text, {
            bold: opts.bold,
            color: opts.shading ? C.WHITE : (opts.color ?? C.DARK),
            size: opts.size ?? 20,
          }),
        ],
      }),
    ],
  });
}

function statusCell(status: string): TableCell {
  return new TableCell({
    width: { size: 1200, type: WidthType.DXA },
    shading: { fill: statusColor(status), type: ShadingType.CLEAR, color: "auto" },
    borders: allBorders("E5E7EB"),
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [run(status, { bold: true, color: C.WHITE, size: 18 })],
      }),
    ],
  });
}

function allBorders(color: string) {
  const b = { style: BorderStyle.SINGLE, size: 4, color };
  return { top: b, bottom: b, left: b, right: b };
}

function sectionHeading(title: string, pageBreak = true): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: pageBreak,
    spacing: { after: 160 },
    children: [run(title, { bold: true, color: C.BLUE, size: 28 })],
  });
}

function subHeading(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 160, after: 100 },
    children: [run(title, { bold: true, color: C.BLUE, size: 24 })],
  });
}

function bulletItem(text: string, num?: number): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      run(num !== undefined ? `${num}. ` : "• ", { bold: true, color: C.BLUE, size: 20 }),
      run(text, { size: 20 }),
    ],
  });
}

/**
 * Extracts the summary sentence from a detailed finding.
 * Strips bullet-point item lists that follow — those are for the web UI only.
 */
function summarizeFinding(finding: string, maxLen = 250): string {
  // Take text before the first bullet list or "Affected items:" / "Images without" etc.
  const cutPatterns = /\n\n(?:Affected|Images|Missing|Headers|Items|Links|Tags|Scripts|Elements|Headings|Checks)[^\n]*:\s*\n/i;
  let summary = finding.split(cutPatterns)[0].trim();

  // Also cut at double-newline followed by "- " bullet
  const bulletStart = summary.indexOf("\n\n- ");
  if (bulletStart > 0) summary = summary.slice(0, bulletStart).trim();

  // Also cut at single newline + bullet if it looks like a list
  const singleBullet = summary.indexOf("\n- ");
  if (singleBullet > 0) summary = summary.slice(0, singleBullet).trim();

  if (summary.length > maxLen) summary = summary.slice(0, maxLen).trimEnd() + "...";
  return summary;
}

// ── Types (mirror what comes from DB) ────────────────────────────

export interface ReportCheck {
  name: string;
  status: string;
  finding: string;
  recommendation: string;
}

export interface ReportQuickWin {
  rank: number;
  action: string;
  impact: string;
  effort: string;
}

export interface ReportAdGroup {
  name: string;
  keywords: string;
  rationale: string;
}

export interface ReportData {
  businessName: string | null;
  url: string;
  createdAt: Date;
  provider: string;
  overallScore: number | null;
  overallGrade: string | null;
  technicalScore: number | null;
  technicalGrade: string | null;
  contentScore: number | null;
  contentGrade: string | null;
  semScore: number | null;
  semGrade: string | null;

  // Previous run for delta
  prevOverallScore?: number | null;
  prevTechnicalScore?: number | null;
  prevContentScore?: number | null;
  prevSemScore?: number | null;

  technicalChecks: ReportCheck[];
  contentChecks: ReportCheck[];
  semChecks: ReportCheck[];

  executiveSummary: string;
  keyStrengths: string;
  keyOpportunities: string;
  technicalPriorityActions: string[];
  contentPriorityActions: string[];
  semStrengths: string[];
  semIssues: string[];
  campaignRecs: string[];
  adGroups: ReportAdGroup[];
  quickWins: ReportQuickWin[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawCrawlData: Record<string, any> | null;
}

// ── Main generator ────────────────────────────────────────────────

export async function generateDocxReport(data: ReportData): Promise<Buffer> {
  const date = data.createdAt.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const children: (Paragraph | Table)[] = [];

  // ── Title page ─────────────────────────────────────────────────
  for (let i = 0; i < 8; i++) children.push(new Paragraph({ children: [] }));

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [run("SEO & SEM Strategy Report", { bold: true, color: C.BLUE, size: 56 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [run(`${data.businessName ?? "Website"} — Homepage Audit`, { color: C.GRAY, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [run(data.url, { color: C.BLUE, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [run(`Report Date: ${date}`, { color: C.GRAY, size: 22 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [run(`AI Provider: ${data.provider.toUpperCase()}`, { color: C.GRAY, size: 22 })],
    })
  );

  // ── Executive Summary ──────────────────────────────────────────
  children.push(sectionHeading("Executive Summary"));

  for (const p of data.executiveSummary.split("\n").filter(Boolean)) {
    children.push(para(p, { color: C.GRAY }));
  }

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        run("Key strengths: ", { bold: true, color: C.DARK }),
        run(data.keyStrengths, { color: C.GRAY }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        run("Key opportunities: ", { bold: true, color: C.DARK }),
        run(data.keyOpportunities, { color: C.GRAY }),
      ],
    })
  );

  // ── Scores table ───────────────────────────────────────────────
  children.push(subHeading("Overall Audit Scores"));

  function deltaStr(current: number | null, prev: number | null | undefined): string {
    if (current === null || prev == null) return "";
    const d = current - prev;
    return d > 0 ? `+${d}` : d < 0 ? `${d}` : "=";
  }

  const hasPrev =
    data.prevOverallScore !== undefined &&
    data.prevOverallScore !== null;

  const scoreRows = [
    ["Technical SEO", data.technicalScore, data.technicalGrade, deltaStr(data.technicalScore, data.prevTechnicalScore)],
    ["Content SEO", data.contentScore, data.contentGrade, deltaStr(data.contentScore, data.prevContentScore)],
    ["SEM / AdWords Readiness", data.semScore, data.semGrade, deltaStr(data.semScore, data.prevSemScore)],
  ] as [string, number | null, string | null, string][];

  const scoreTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell("Category", 4000),
          headerCell("Score", 1500),
          headerCell("Grade", 1200),
          ...(hasPrev ? [headerCell("vs Previous", 1500)] : []),
        ],
      }),
      ...scoreRows.map(([cat, score, grade, delta]) =>
        new TableRow({
          children: [
            cell(cat),
            cell(score !== null ? `${score} / 100` : "—", { alignment: AlignmentType.CENTER }),
            cell(grade ?? "N/A", { bold: true, alignment: AlignmentType.CENTER }),
            ...(hasPrev
              ? [
                  cell(delta || "—", {
                    alignment: AlignmentType.CENTER,
                    shading: delta.startsWith("+") ? C.GREEN : delta.startsWith("-") ? C.RED : "888888",
                  }),
                ]
              : []),
          ],
        })
      ),
      // Overall row
      new TableRow({
        children: [
          cell("Overall", { bold: true, shading: C.LIGHT_BLUE, color: C.BLUE }),
          cell(data.overallScore !== null ? `${data.overallScore} / 100` : "—", {
            bold: true,
            alignment: AlignmentType.CENTER,
            shading: C.LIGHT_BLUE,
            color: C.BLUE,
          }),
          cell(data.overallGrade ?? "N/A", {
            bold: true,
            alignment: AlignmentType.CENTER,
            shading: C.LIGHT_BLUE,
            color: C.BLUE,
          }),
          ...(hasPrev
            ? [
                (() => {
                  const d = deltaStr(data.overallScore, data.prevOverallScore);
                  return cell(d || "—", {
                    bold: true,
                    alignment: AlignmentType.CENTER,
                    shading: d.startsWith("+") ? C.GREEN : d.startsWith("-") ? C.RED : "888888",
                  });
                })(),
              ]
            : []),
        ],
      }),
    ],
  });

  children.push(scoreTable);

  // ── 1. Technical SEO ───────────────────────────────────────────
  children.push(sectionHeading("1. Technical SEO Review"));
  children.push(para("Is the page indexed correctly and technically sound for organic search?", { color: C.GRAY }));
  children.push(checksTable(data.technicalChecks));

  if (data.technicalPriorityActions.length) {
    children.push(subHeading("Technical SEO — Priority Actions"));
    data.technicalPriorityActions.forEach((a, i) => children.push(bulletItem(a, i + 1)));
  }

  // ── 2. Content SEO ─────────────────────────────────────────────
  children.push(sectionHeading("2. Content SEO Review"));
  children.push(para("Is the content appropriate for organic traffic to find this page?", { color: C.GRAY }));
  children.push(checksTable(data.contentChecks));

  if (data.contentPriorityActions.length) {
    children.push(subHeading("Content SEO — Priority Actions"));
    data.contentPriorityActions.forEach((a, i) => children.push(bulletItem(a, i + 1)));
  }

  // ── 3. SEM ─────────────────────────────────────────────────────
  children.push(sectionHeading("3. Google Ads / SEM — Destination URL Review"));
  children.push(checksTable(data.semChecks));

  if (data.semStrengths.length) {
    children.push(subHeading("Strengths as a paid landing page"));
    data.semStrengths.forEach((s) => children.push(bulletItem(s)));
  }

  if (data.semIssues.length) {
    children.push(subHeading("Issues that reduce paid campaign performance"));
    data.semIssues.forEach((s) => children.push(bulletItem(s)));
  }

  if (data.adGroups.length) {
    children.push(subHeading("Recommended Ad Groups — Destination: This Page"));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell("Ad Group", 2400),
              headerCell("Target Keywords", 3600),
              headerCell("Why This Page", 3600),
            ],
          }),
          ...data.adGroups.map((g) =>
            new TableRow({
              children: [
                cell(g.name, { bold: true }),
                cell(g.keywords),
                cell(g.rationale, { color: C.GRAY }),
              ],
            })
          ),
        ],
      })
    );
  }

  if (data.campaignRecs.length) {
    children.push(subHeading("SEM Campaign Recommendations"));
    data.campaignRecs.forEach((r, i) => children.push(bulletItem(r, i + 1)));
  }

  // ── 4. Quick Wins ──────────────────────────────────────────────
  children.push(sectionHeading("4. Top Quick Wins (Ranked by Impact vs Effort)"));

  if (data.quickWins.length) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell("#", 600),
              headerCell("Action", 5400),
              headerCell("Impact", 1800),
              headerCell("Effort", 1800),
            ],
          }),
          ...data.quickWins.map((w) =>
            new TableRow({
              children: [
                cell(String(w.rank), { bold: true, alignment: AlignmentType.CENTER }),
                cell(w.action, { bold: true }),
                cell(w.impact),
                cell(w.effort),
              ],
            })
          ),
        ],
      })
    );
  }

  // ── Appendix: Raw Crawl Data ───────────────────────────────────
  if (data.rawCrawlData) {
    const cd = data.rawCrawlData;

    children.push(sectionHeading("Appendix: Raw Crawl Data"));
    children.push(
      para(
        "All data below was collected directly from the live page crawl. This section is Python-generated from raw crawl results — not AI.",
        { color: C.GRAY, size: 18 }
      )
    );

    // A1. Page meta
    children.push(subHeading("A1. Page Meta Data"));
    const metaRows: [string, string][] = [
      ["Title Tag", `${cd.title ?? "NOT SET"} (${cd.title_length ?? 0} chars — optimal 50–60)`],
      ["Meta Description", `${cd.meta_description ?? "NOT SET"} (${cd.meta_description_length ?? 0} chars — optimal 120–160)`],
      ["Canonical URL", cd.canonical_url ?? "Not set"],
      ["HTML Lang", cd.html_lang ?? "NOT SET"],
      ["Viewport", cd.has_viewport ? "Set" : "NOT SET"],
      ["Meta Robots", cd.meta_robots ?? "Not set (defaults to index, follow)"],
      ["Charset", cd.charset ?? "Not set"],
      ["HTTPS", cd.is_https ? "Yes" : "No"],
      ["Response Time", `${cd.response_time_ms ?? 0} ms`],
      ["Page Size", `${(cd.content_length ?? 0).toLocaleString()} bytes`],
      ["Word Count", String(cd.word_count ?? 0)],
      ["Paragraphs", String(cd.paragraph_count ?? 0)],
      ["Internal Links", String(cd.internal_link_count ?? 0)],
      ["External Links", String(cd.external_link_count ?? 0)],
      ["Phone Links", (cd.tel_links ?? []).join(", ") || "None found"],
      ["Schema Types", (cd.schema_types ?? []).join(", ") || "None detected"],
      ["Tech Detected", (cd.tech_detected ?? []).join(", ") || "None"],
      ["Forms Found", String(cd.form_count ?? 0)],
      ["Mixed Content", (cd.mixed_content ?? []).length > 0 ? `${cd.mixed_content.length} items` : "None"],
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [headerCell("Property", 2400), headerCell("Value", 7200)],
          }),
          ...metaRows.map(([label, value]) =>
            new TableRow({
              children: [cell(label, { bold: true }), cell(String(value).slice(0, 300))],
            })
          ),
        ],
      })
    );

    // A2. Headings
    children.push(subHeading("A2. Heading Structure"));
    const headings = cd.headings ?? {};
    const hasHeadings = Object.values(headings).some((v) => (v as string[]).length > 0);

    if (hasHeadings) {
      const hRows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [headerCell("Level", 900), headerCell("Text", 8700)],
        }),
      ];
      for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
        for (const text of (headings[level] ?? []) as string[]) {
          hRows.push(
            new TableRow({
              children: [
                cell(level.toUpperCase(), { bold: true }),
                cell(text.slice(0, 200)),
              ],
            })
          );
        }
      }
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: hRows }));
    } else {
      children.push(para("No headings found.", { color: C.GRAY, size: 18 }));
    }

    // A3. Images
    children.push(subHeading("A3. Image Audit"));
    const images: Record<string, unknown>[] = cd.images ?? [];
    const missingAlt = images.filter((i) => !i.has_alt).length;
    const noLazy = images.filter((i) => !i.has_lazy_loading).length;

    children.push(
      para(
        `Total: ${cd.image_count ?? images.length} images — Missing alt: ${missingAlt} — Not lazy-loaded: ${noLazy}`,
        { bold: true, size: 20 }
      )
    );

    if (images.length) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell("#", 500),
                headerCell("Filename / URL", 4000),
                headerCell("Alt Text", 3200),
                headerCell("Fmt", 700),
                headerCell("Lazy/Dims", 1200),
              ],
            }),
            ...images.map((img, i) => {
              const src = String(img.src ?? "");
              const filename = src.split("/").pop()?.split("?")[0] ?? src;
              const alt = String(img.alt ?? "").trim();
              const hasAlt = Boolean(img.has_alt);

              return new TableRow({
                children: [
                  cell(String(i + 1), { alignment: AlignmentType.CENTER }),
                  cell(filename.slice(0, 80)),
                  new TableCell({
                    borders: allBorders("E5E7EB"),
                    children: [
                      new Paragraph({
                        spacing: { before: 40, after: 40 },
                        children: [
                          new TextRun({
                            text: hasAlt ? alt.slice(0, 100) : "MISSING",
                            bold: !hasAlt,
                            color: hasAlt ? C.DARK : C.RED,
                            size: 18,
                            font: "Arial",
                          }),
                        ],
                      }),
                    ],
                  }),
                  cell(String(img.format ?? "?").toUpperCase(), { size: 18 }),
                  cell(`Lazy: ${img.has_lazy_loading ? "Y" : "N"}  Dims: ${img.has_dimensions ? "Y" : "N"}`, { size: 18 }),
                ],
              });
            }),
          ],
        })
      );
    }

    // A4. External Links
    children.push(subHeading("A4. External Links"));
    const extLinks: Record<string, string>[] = cd.external_links ?? [];
    if (extLinks.length) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [headerCell("Anchor Text", 3000), headerCell("URL", 6600)],
            }),
            ...extLinks.map((link) =>
              new TableRow({
                children: [
                  cell(String(link.text ?? "(no text)").slice(0, 60)),
                  cell(String(link.href ?? "").slice(0, 120)),
                ],
              })
            ),
          ],
        })
      );
    } else {
      children.push(para("No external links found.", { color: C.GRAY, size: 18 }));
    }

    // A5. OG / Social Tags
    children.push(subHeading("A5. Open Graph & Social Tags"));
    const og: Record<string, string> = cd.og_tags ?? {};
    const tw: Record<string, string> = cd.twitter_tags ?? {};
    const allTags = { ...og, ...tw };
    if (Object.keys(allTags).length) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [headerCell("Tag", 2400), headerCell("Value", 7200)],
            }),
            ...Object.entries(allTags).map(([tag, val]) =>
              new TableRow({
                children: [cell(tag, { bold: true }), cell(String(val).slice(0, 200))],
              })
            ),
          ],
        })
      );
    } else {
      children.push(para("No OG or Twitter tags found.", { color: C.GRAY, size: 18 }));
    }

    // A6. Schema
    children.push(subHeading("A6. Structured Data (JSON-LD)"));
    const schemas: string[] = cd.schema_types ?? [];
    if (schemas.length) {
      schemas.forEach((s) => children.push(bulletItem(s)));
    } else {
      children.push(para("No JSON-LD schema detected.", { color: C.GRAY, size: 18 }));
    }
  }

  // ── Footer ──────────────────────────────────────────────────────
  children.push(new Paragraph({ children: [] }));
  children.push(
    para(`Report prepared based on live page crawl of ${data.url} conducted on ${date}.`, {
      color: C.GRAY,
      size: 18,
    })
  );

  // ── Build Document ─────────────────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22, color: C.DARK },
        },
      },
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

// ── Checks table helper ───────────────────────────────────────────

function checksTable(checks: ReportCheck[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell("Check", 2400),
          headerCell("Status", 1200),
          headerCell("Finding & Recommendation", 6000),
        ],
      }),
      ...checks.map((check) =>
        new TableRow({
          children: [
            cell(check.name, { bold: true }),
            statusCell(check.status),
            new TableCell({
              borders: allBorders("E5E7EB"),
              children: [
                new Paragraph({
                  spacing: { before: 40, after: 20 },
                  children: [run(summarizeFinding(check.finding), { size: 20 })],
                }),
                new Paragraph({
                  spacing: { before: 20, after: 40 },
                  children: [
                    run("Rec: ", { bold: true, color: C.BLUE, size: 18 }),
                    run(check.recommendation, { color: C.GRAY, size: 18 }),
                  ],
                }),
              ],
            }),
          ],
        })
      ),
    ],
  });
}
