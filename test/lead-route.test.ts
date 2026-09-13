import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocked BEFORE the route module is imported. The route constructs a real
// Resend client at module scope; without this mock a test that POSTs could
// deliver real mail through Erica's Resend account, and would still "fail
// correctly", so nothing would signal what happened.
const sendMock = vi.fn().mockResolvedValue({ data: { id: "test" }, error: null });

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

// Distinctive and unlikely to collide with anything the handler emits.
const SENTINEL = "ZZ_CTX_SENTINEL_ZZ";
const CR = String.fromCharCode(13);
const LF = String.fromCharCode(10);
const CRLF = CR + LF;

async function postLead(body: unknown) {
  const { POST } = await import("../app/api/lead/route");
  const req = new Request("http://localhost/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // The handler only ever calls req.json(); NextRequest's extra surface is unused.
  return POST(req as any);
}

function outboundMail() {
  expect(sendMock).toHaveBeenCalledOnce();
  return sendMock.mock.calls[0][0] as {
    subject: string;
    text: string;
    to: string;
    from: string;
  };
}

describe("POST /api/lead", () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  it("never lets chat context reach Resend, even when posted", async () => {
    // Assume the endpoint is public: a caller CAN still send `context`.
    const res = await postLead({
      name: "Test Client",
      email: "client@example.com",
      context: `user: ${SENTINEL}` + LF + "assistant: something health-adjacent",
    });

    // It must succeed -- we strip, we do not break the caller.
    expect(res.status).toBe(200);

    const { subject, text } = outboundMail();

    // The invariant is about what LEAVES the process, not how it was parsed.
    // A schema-level assertion would keep passing if someone later read the
    // raw body and interpolated it into the mail.
    expect(text).not.toContain(SENTINEL);
    expect(subject).not.toContain(SENTINEL);
    expect(text).not.toMatch(/conversation snippet/i);

    // Whole serialized payload, to catch any field we did not think to name.
    expect(JSON.stringify(outboundMail())).not.toContain(SENTINEL);
  });

  it("does not log chat context anywhere", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await postLead({
      name: "Test Client",
      email: "client@example.com",
      context: SENTINEL,
    });

    for (const spy of [errorSpy, logSpy]) {
      for (const call of spy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(SENTINEL);
      }
    }
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("still delivers name and email", async () => {
    const res = await postLead({ name: "Jane Doe", email: "jane@example.com" });
    expect(res.status).toBe(200);

    const { text, subject, to } = outboundMail();
    expect(text).toContain("Jane Doe");
    expect(text).toContain("jane@example.com");
    expect(subject).toContain("Jane Doe");
    expect(to).toBe("business@invalid.test");
  });

  // NOTE: input validation, header sanitization and error-response hygiene
  // are asserted in a separate commit -- they are distinct changes from this
  // privacy fix and would blur its diff.
});
