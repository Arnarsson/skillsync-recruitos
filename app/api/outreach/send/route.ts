import { NextRequest, NextResponse } from "next/server";
import { sendOutreachEmail } from "@/lib/resend";
import { prisma } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, candidateId } = body;

    // Validate required fields
    if (!to || typeof to !== "string" || !EMAIL_REGEX.test(to)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    if (!emailBody || typeof emailBody !== "string" || emailBody.trim().length === 0) {
      return NextResponse.json(
        { error: "Email body is required" },
        { status: 400 }
      );
    }

    // Convert plain text body to HTML (preserve line breaks)
    const htmlBody = emailBody
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");

    // Send via Resend
    const result = await sendOutreachEmail({
      to,
      subject: subject.trim(),
      body: htmlBody,
    });

    console.log(`Outreach email sent to ${to}, messageId: ${result?.id}`);

    // Optionally update candidate pipeline stage
    if (candidateId) {
      try {
        await prisma.candidate.update({
          where: { id: candidateId },
          data: { pipelineStage: "outreached" },
        });
        console.log(`Candidate ${candidateId} moved to 'outreached' stage`);
      } catch (dbError) {
        // Non-fatal: email was sent, just log the DB error
        console.warn(`Failed to update candidate pipeline stage: ${dbError}`);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: result?.id,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Outreach send error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to send email", details: errorMessage },
      { status: 500 }
    );
  }
}
