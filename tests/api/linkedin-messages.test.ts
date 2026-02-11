import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { upsertMock, findManyMock, countMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/extension-auth", () => ({
  requireUserOrExtension: vi.fn(async () => ({ kind: "extension" })),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    linkedinMessage: {
      upsert: upsertMock,
      findMany: findManyMock,
      count: countMock,
    },
  },
}));

import { POST, GET } from "@/app/api/linkedin/messages/route";

describe("linkedin messages route", () => {
  beforeEach(() => {
    upsertMock.mockReset();
    findManyMock.mockReset();
    countMock.mockReset();
  });

  it("persists messages on POST", async () => {
    upsertMock.mockResolvedValue({
      id: "msg_1",
      sender: "Alice",
      content: "Hello from LinkedIn",
    });

    const request = new NextRequest("http://localhost:3000/api/linkedin/messages", {
      method: "POST",
      body: JSON.stringify({
        source: "linkedin_extension",
        messages: [{ sender: "Alice", content: "Hello from LinkedIn" }],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.processed).toBe(1);
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });

  it("returns stored messages on GET", async () => {
    findManyMock.mockResolvedValue([
      { id: "msg_1", sender: "Alice", content: "Hello", createdAt: new Date() },
    ]);
    countMock.mockResolvedValue(1);

    const request = new NextRequest(
      "http://localhost:3000/api/linkedin/messages?sender=Alice&limit=10"
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(1);
    expect(Array.isArray(body.messages)).toBe(true);
    expect(findManyMock).toHaveBeenCalledTimes(1);
  });
});
