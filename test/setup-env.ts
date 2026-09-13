// Test credentials only.
//
// app/api/lead/route.ts reads SMTP_* into module-level consts at import time,
// so these must be set before the route module is ever imported -- hence a
// setupFile rather than in-test stubbing.
//
// Two independent safety layers keep the suite from sending real mail:
//   1. these dummy values overwrite anything inherited from a real environment
//   2. nodemailer.createTransport is mocked in the test file itself
// Layer 2 is the one that matters; layer 1 exists so that a future test which
// forgets to mock fails loudly against a nonexistent host instead of quietly
// delivering to Erica's inbox.
process.env.SMTP_HOST = "smtp.invalid.test";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "test@invalid.test";
process.env.SMTP_PASS = "not-a-real-password";
process.env.BUSINESS_EMAIL = "business@invalid.test";
process.env.OPENAI_API_KEY = "sk-test-not-a-real-key";
