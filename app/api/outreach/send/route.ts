import { NextRequest, NextResponse } from "next/server";
import { sendOutreachEmail } from "@/lib/resend";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { outreachSendSchema } from "@/lib/validation/apiSchemas";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parsed = outreachSendSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { to, subject, body: emailBody, candidateId } = parsed.data;

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
