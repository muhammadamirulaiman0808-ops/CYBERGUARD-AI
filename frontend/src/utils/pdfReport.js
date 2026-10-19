import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getRisk } from "./risk";
import { hostOf } from "./format";

const INK = [6, 13, 20];
const CYAN = [43, 228, 240];
const GREY = [95, 110, 125];
const MARGIN = 40;

// jsPDF's built-in fonts only cover basic Latin, so keep the text plain.
const clean = (text) => String(text ?? "").replace(/`/g, "").replace(/[^\x20-\x7E -ÿ]/g, "");

const HEADER_NAMES = {
  HSTS: "Strict-Transport-Security",
  CSP: "Content-Security-Policy",
  Clickjacking: "X-Frame-Options",
  MIME: "X-Content-Type-Options",
  Referrer: "Referrer-Policy",
  Permissions: "Permissions-Policy",
};

function sslText(ssl = {}) {
  if (ssl.status === "Valid") {
    const left = typeof ssl.days_left === "number" ? `, ${ssl.days_left} days left` : "";
    return `Expires ${ssl.expiry || "unknown"}${left}${ssl.issuer ? `. Issued by ${ssl.issuer}` : ""}`;
  }
  return ssl.error || "No valid certificate found";
}

export function downloadPDF(result) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;

  const score = result.security_score ?? 0;
  const risk = getRisk(score);
  const scannedAt = result.scanned_at ? new Date(result.scanned_at) : new Date();

  // Title band
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageWidth, 78, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CyberGuard AI", MARGIN, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...CYAN);
  doc.text("Website security report", MARGIN, 56);

  // Website and headline numbers
  let y = 112;
  doc.setTextColor(20, 30, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  const siteLines = doc.splitTextToSize(clean(result.website), contentWidth);
  doc.text(siteLines, MARGIN, y);
  y += siteLines.length * 18 + 4;

  autoTable(doc, {
    startY: y,
    theme: "plain",
    body: [
      ["Security score", `${score} / 100`],
      ["Risk level", risk.label],
      ["Scanned", scannedAt.toLocaleString()],
      ...(result.status_code ? [["HTTP status", String(result.status_code)]] : []),
    ],
    styles: { fontSize: 10, cellPadding: { top: 2, bottom: 2, left: 0, right: 8 } },
    columnStyles: { 0: { textColor: GREY, cellWidth: 100 }, 1: { fontStyle: "bold" } },
    margin: { left: MARGIN, right: MARGIN },
  });
  y = doc.lastAutoTable.finalY + 14;

  if (result.summary) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(40, 50, 60);
    const lines = doc.splitTextToSize(clean(result.summary), contentWidth);
    doc.text(lines, MARGIN, y);
    y += lines.length * 14 + 8;
  }

  // What was checked
  const checks = [
    ["HTTPS", result.https === "Enabled" ? "Enabled" : "Not secure", result.https === "Enabled" ? "Served over an encrypted connection" : "Served over plain HTTP"],
    ["SSL certificate", result.ssl?.status || "Unknown", sslText(result.ssl)],
    ...Object.entries(result.headers || {}).map(([key, status]) => [
      HEADER_NAMES[key] || key,
      status === "Enabled" ? "Set" : "Missing",
      "",
    ]),
  ];

  autoTable(doc, {
    startY: y,
    head: [["Check", "Result", "Details"]],
    body: checks.map((row) => row.map(clean)),
    headStyles: { fillColor: INK, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: MARGIN, right: MARGIN },
  });
  y = doc.lastAutoTable.finalY + 22;

  // Findings and recommendations (new scans carry findings; older saved scans only have lists)
  const actionable = (result.findings || []).filter((finding) => finding.severity !== "pass");
  if (result.findings) {
    autoTable(doc, {
      startY: y,
      head: [["Severity", "Finding", "What to do"]],
      body: actionable.length
        ? actionable.map((f) => [f.severity.toUpperCase(), clean(`${f.title}. ${f.detail || ""}`), clean(f.fix || "")])
        : [["None", "No issues found.", ""]],
      headStyles: { fillColor: INK, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 5, valign: "top" },
      columnStyles: { 0: { cellWidth: 56, fontStyle: "bold" } },
      margin: { left: MARGIN, right: MARGIN },
    });
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Analysis"]],
      body: (result.analysis || []).map((item) => [clean(item)]),
      headStyles: { fillColor: INK, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 5 },
      margin: { left: MARGIN, right: MARGIN },
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [["Recommendations"]],
      body: (result.recommendations || []).map((item) => [clean(item)]),
      headStyles: { fillColor: INK, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 5 },
      margin: { left: MARGIN, right: MARGIN },
    });
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`CyberGuard AI - page ${page} of ${pages}`, MARGIN, pageHeight - 20);
  }

  const day = scannedAt.toISOString().slice(0, 10);
  const name = hostOf(result.website).replace(/[^a-z0-9.-]+/gi, "_") || "website";
  doc.save(`CyberGuard_${name}_${day}.pdf`);
}
