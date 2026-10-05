import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AuditReport } from "../types/audit";
import { ConsultantProfile } from "../types/report";
import { ReportModel } from "./reportModel";
import { BRAND_ICON_128_BASE64 } from "../assets/brandLogo";

export class PdfGenerator {
  public static generate(report: AuditReport, consultant: ConsultantProfile): jsPDF {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const prepared = ReportModel.prepare(report, consultant);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    // Brand color extraction or fallback
    const brandColor = consultant.brandColor || "#059669";
    // Convert hex to rgb
    const hex = brandColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 5;
    const g = parseInt(hex.substring(2, 4), 16) || 150;
    const b = parseInt(hex.substring(4, 6), 16) || 105;

    // --- PAGE 1: HEADER & EXECUTIVE SUMMARY ---
    // Top banner
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageWidth, 8, "F");

    // Brand Logo Top-Right
    try {
      doc.addImage(BRAND_ICON_128_BASE64, "PNG", pageWidth - margin - 42, 26, 42, 42);
    } catch {
      // fallback if image driver fails in certain environments
    }

    // Consultant Info Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(consultant.name, margin, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${consultant.title} • ${consultant.company}`, margin, 53);
    doc.text(`${consultant.website} • ${consultant.email} • ${consultant.phone}`, margin, 66);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(margin, 76, pageWidth - margin, 76);

    // Document Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("Website Tracking & Conversion Audit", margin, 105);

    // Subtitle / Target details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Audited Website: ${report.website}`, margin, 123);
    doc.text(`Audit Date: ${report.auditDate}`, margin, 138);

    // Score Callout Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(pageWidth - margin - 150, 90, 150, 65, 6, 6, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(r, g, b);
    doc.text(`${report.score.total}/100`, pageWidth - margin - 140, 128);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`GRADE: ${report.score.grade}`, pageWidth - margin - 140, 145);

    // Executive Summary Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Executive Summary", margin, 180);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(prepared.executiveSummary, pageWidth - margin * 2);
    doc.text(splitSummary, margin, 196);

    let currentY = 196 + splitSummary.length * 13 + 15;

    // Score Breakdown Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Tracking Health Dimension Breakdown", margin, currentY);
    currentY += 10;

    const catRows = [
      ["Platform Coverage", `${report.score.categories.platformCoverage.score} / ${report.score.categories.platformCoverage.max}`, report.score.categories.platformCoverage.explanation],
      ["Conversion Tracking", `${report.score.categories.conversionTracking.score} / ${report.score.categories.conversionTracking.max}`, report.score.categories.conversionTracking.explanation],
      ["Event Tracking", `${report.score.categories.eventTracking.score} / ${report.score.categories.eventTracking.max}`, report.score.categories.eventTracking.explanation],
      ["Server-Side Tracking", `${report.score.categories.serverSideTracking.score} / ${report.score.categories.serverSideTracking.max}`, report.score.categories.serverSideTracking.explanation],
      ["DataLayer Architecture", `${report.score.categories.dataLayer.score} / ${report.score.categories.dataLayer.max}`, report.score.categories.dataLayer.explanation],
      ["Consent & Privacy", `${report.score.categories.consent.score} / ${report.score.categories.consent.max}`, report.score.categories.consent.explanation],
      ["Implementation Quality", `${report.score.categories.implementationQuality.score} / ${report.score.categories.implementationQuality.max}`, report.score.categories.implementationQuality.explanation],
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [["Audit Dimension", "Score", "Technical Rationale"]],
      body: catRows,
      theme: "striped",
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8.5, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 120, fontStyle: "bold" },
        1: { cellWidth: 60, halign: "center" },
        2: { cellWidth: "auto" },
      },
    });

    // @ts-expect-error - jspdf-autotable extends jsPDF with lastAutoTable
    currentY = doc.lastAutoTable.finalY + 25;

    // Platform Audit Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Platform Detection & Implementation Status", margin, currentY);
    currentY += 10;

    const platformRows = report.results.map((r) => [
      r.platform,
      r.component,
      r.status.toUpperCase(),
      `${r.confidence}%`,
      r.identifiers.length > 0 ? r.identifiers.join(", ") : "None",
      r.events.length > 0 ? r.events.slice(0, 4).join(", ") : "None",
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [["Platform", "Component", "Status", "Confidence", "Identifiers", "Observable Events"]],
      body: platformRows,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: "bold" },
        1: { cellWidth: 90 },
        2: { cellWidth: 70, halign: "center" },
        3: { cellWidth: 55, halign: "center" },
        4: { cellWidth: 110 },
        5: { cellWidth: "auto" },
      },
    });

    // --- PAGE 2: UNIVERSAL EVENTS & ISSUES ---
    doc.addPage();
    let p2Y = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Universal Event Tracking Table", margin, p2Y);
    p2Y += 10;

    const eventRows = report.events.length > 0
      ? report.events.map((e) => [
          e.event,
          e.platform,
          e.browser ? "Yes" : "No",
          e.serverSignal ? "Yes" : "No",
          e.eventId || "Missing",
          e.transactionId || "N/A",
          e.status.toUpperCase(),
        ])
      : [["No standard events detected on initial scan", "-", "-", "-", "-", "-", "-"]];

    autoTable(doc, {
      startY: p2Y,
      margin: { left: margin, right: margin },
      head: [["Event Name", "Platform", "Browser", "Server Signal", "Event ID", "Transaction ID", "Status"]],
      body: eventRows,
      theme: "striped",
      headStyles: { fillColor: [r, g, b], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 4.5 },
      columnStyles: {
        0: { cellWidth: 90, fontStyle: "bold" },
        1: { cellWidth: 85 },
        2: { cellWidth: 50, halign: "center" },
        3: { cellWidth: 65, halign: "center" },
        4: { cellWidth: 85 },
        5: { cellWidth: 75 },
        6: { cellWidth: "auto", halign: "center" },
      },
    });

    // @ts-expect-error - jspdf-autotable extends jsPDF with lastAutoTable
    p2Y = doc.lastAutoTable.finalY + 25;

    // Detailed Audit Issues & Recommendations
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Audit Findings & Strategic Recommendations", margin, p2Y);
    p2Y += 10;

    const issueRows = report.issues.map((i) => [
      i.severity.toUpperCase(),
      i.title,
      i.finding,
      i.impact,
      i.recommendation,
    ]);

    autoTable(doc, {
      startY: p2Y,
      margin: { left: margin, right: margin },
      head: [["Severity", "Issue", "Observable Finding", "Business Impact", "Actionable Recommendation"]],
      body: issueRows,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 7.5, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 60, halign: "center", fontStyle: "bold" },
        1: { cellWidth: 95, fontStyle: "bold" },
        2: { cellWidth: 110 },
        3: { cellWidth: 115 },
        4: { cellWidth: "auto" },
      },
    });

    // --- PAGE 3: ACTION PLAN & LIMITATIONS ---
    doc.addPage();
    let p3Y = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Priority Remediation Action Plan", margin, p3Y);
    p3Y += 15;

    prepared.actionPlan.forEach((plan) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(r, g, b);
      doc.text(`Step ${plan.priority}:`, margin, p3Y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const splitTask = doc.splitTextToSize(plan.task, pageWidth - margin * 2 - 50);
      doc.text(splitTask, margin + 50, p3Y);
      p3Y += splitTask.length * 12;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const splitImpact = doc.splitTextToSize(`Expected Business Impact: ${plan.impact}`, pageWidth - margin * 2 - 50);
      doc.text(splitImpact, margin + 50, p3Y);
      p3Y += splitImpact.length * 11 + 10;
    });

    p3Y += 15;
    // Server-Side Tracking Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Server-Side Tracking & Container Access Requirements", margin, p3Y);
    p3Y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const disclaimerText = `${report.serverSide.disclaimer} To verify end-to-end delivery of Meta Conversions API (CAPI), TikTok Events API, or Google Server Container hits, the following authenticated access credentials are required: ${report.serverSide.requirements.join(", ")}.`;
    const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - margin * 2);
    doc.text(splitDisclaimer, margin, p3Y);
    p3Y += splitDisclaimer.length * 12 + 20;

    // Technical Limitations & Legal Disclaimer
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("Audit Scope & Legal Notice", margin, p3Y);
    p3Y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const legalNotice = "This audit evaluates technically observable client-side evidence, network beacons, and global window objects available in the browser at the time of execution. It does not certify legal privacy compliance (GDPR/ePrivacy/CCPA) which requires independent legal review. Attribution parameters (e.g. fbclid, gclid) indicate click tracking capability but do not verify active advertising campaigns without direct ad platform API authorization.";
    const splitLegal = doc.splitTextToSize(legalNotice, pageWidth - margin * 2);
    doc.text(splitLegal, margin, p3Y);

    // Page Footers across all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(consultant.reportFooter, margin, pageHeight - 18);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 18);
    }

    return doc;
  }
}
