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

  describe("validation", () => {
    it("rejects a submission with no name or email", async () => {
      const res = await postLead({ name: "", email: "" });
      expect(res.status).toBe(400);
      expect(sendMock).not.toHaveBeenCalled();
    });

    it("rejects a malformed email rather than mailing 'Unknown'", async () => {
      const res = await postLead({ name: "Jane Doe", email: "not-an-email" });
      expect(res.status).toBe(400);
      expect(sendMock).not.toHaveBeenCalled();
    });

    it("never mails the literal string Unknown", async () => {
      await postLead({});
      expect(sendMock).not.toHaveBeenCalled();
    });
  });

  describe("header injection", () => {
    it("strips CR and LF from the name before it reaches the subject", async () => {
      const injected =
        "Jane" + CRLF + "Bcc: attacker@example.com" + CRLF + "Subject: spam";
      const res = await postLead({ name: injected, email: "jane@example.com" });
      expect(res.status).toBe(200);

      const { subject } = outboundMail();
      expect(subject).not.toContain(CR);
      expect(subject).not.toContain(LF);
      expect(subject.toLowerCase()).not.toContain("bcc:");
    });

    it("caps an absurdly long name", async () => {
      const res = await postLead({
        name: "A".repeat(5000),
        email: "jane@example.com",
      });
      expect(res.status).toBe(200);
      expect(outboundMail().subject.length).toBeLessThan(300);
    });
  });

  describe("error responses", () => {
    it("does not leak internal error detail to the caller", async () => {
      sendMock.mockRejectedValueOnce(
        new Error("Resend 401: invalid api key re_live_SECRETVALUE")
      );
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const res = await postLead({ name: "Jane", email: "jane@example.com" });
      expect(res.status).toBe(500);

      const payload = await res.json();
      const serialized = JSON.stringify(payload);
      expect(serialized).not.toContain("re_live_SECRETVALUE");
      expect(serialized).not.toContain("401");
      expect(payload).not.toHaveProperty("details");
      expect(payload).not.toHaveProperty("key");

      errorSpy.mockRestore();
    });

    it("does not leak config booleans when unconfigured", async () => {
      const res = await postLead({ name: "Jane", email: "jane@example.com" });
      const payload = await res.json().catch(() => ({}));
      expect(payload).not.toHaveProperty("key");
      expect(payload).not.toHaveProperty("to");
    });
  });
});
