/**
 * Legacy webhook path — redirects to the main handler.
 * Stripe webhook should be configured to POST to /api/stripe/webhook
 * but this catches the old path too.
 */
export { POST } from "@/app/api/stripe/webhook/route";
