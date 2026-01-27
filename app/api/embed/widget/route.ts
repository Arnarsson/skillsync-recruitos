import { NextResponse } from "next/server";

export const runtime = "edge";

// Simple embeddable widget script.
// Usage:
//   <script async src="https://YOUR_DOMAIN/api/embed/widget" data-username="octocat"></script>
// Optional:
//   data-theme="light|dark" (default: dark)
//   data-height="520" (default: 520)
//   data-width="100%" (default: 100%)
//
// The script injects an iframe pointing to /embed/profile/:username
export async function GET() {
  const js = `(() => {
  const script = document.currentScript;
  if (!script) return;

  const username = script.getAttribute('data-username');
  if (!username) {
    console.warn('[SkillSync widget] Missing data-username');
    return;
  }

  const theme = script.getAttribute('data-theme') || 'dark';
  const height = script.getAttribute('data-height') || '520';
  const width = script.getAttribute('data-width') || '100%';

  const host = script.src.split('/api/embed/widget')[0];
  const iframe = document.createElement('iframe');
  iframe.src = host + '/embed/profile/' + encodeURIComponent(username) + '?theme=' + encodeURIComponent(theme);
  iframe.width = width;
  iframe.height = height;
  iframe.style.border = '0';
  iframe.style.borderRadius = '12px';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

  // Insert after script tag
  const container = document.createElement('div');
  container.style.width = width;
  container.appendChild(iframe);
  script.parentNode && script.parentNode.insertBefore(container, script.nextSibling);
})();
`;

  return new NextResponse(js, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
    },
  });
}
