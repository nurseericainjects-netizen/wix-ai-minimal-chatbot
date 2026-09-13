// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "../app/page";

const SENTINEL = "ZZ_CHAT_SENTINEL_ZZ";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (url: string) => {
    if (String(url).includes("/api/chat")) {
      return new Response(JSON.stringify({ reply: "A reply." }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function leadCall() {
  return fetchMock.mock.calls.find((c) => String(c[0]).includes("/api/lead"));
}

function leadRequestBody() {
  const call = leadCall();
  expect(call, "expected a POST to /api/lead").toBeTruthy();
  return JSON.parse((call![1] as RequestInit).body as string);
}

/** Hold a conversation, then fill and submit the lead form. */
async function chatThenSubmitLead(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByPlaceholderText(/treatments or aftercare/i),
    SENTINEL
  );
  await user.click(screen.getByRole("button", { name: /^send$/i }));
  await waitFor(() => expect(screen.getByText("A reply.")).toBeTruthy());

  await user.type(screen.getByPlaceholderText(/first name/i), "Jane");
  await user.type(screen.getByPlaceholderText(/^email$/i), "jane@example.com");
  await user.click(screen.getByRole("button", { name: /send to nurse erica/i }));

  await waitFor(() => expect(leadCall()).toBeTruthy());
}

describe("lead submission from the client", () => {
  it("sends a body with keys exactly [name, email] after a chat", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await chatThenSubmitLead(user);

    const body = leadRequestBody();
    expect(Object.keys(body).sort()).toEqual(["email", "name"]);
    expect(body).toEqual({ name: "Jane", email: "jane@example.com" });
  });

  it("never puts chat text in the lead request, in any field", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await chatThenSubmitLead(user);

    const raw = (leadCall()![1] as RequestInit).body as string;
    expect(raw).not.toContain(SENTINEL);
  });

  it("still blocks submission when name or email is empty", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: /send to nurse erica/i }));

    expect(await screen.findByText(/enter both your name and email/i)).toBeTruthy();
    expect(leadCall()).toBeUndefined();
  });
});
