// Test credentials only.
//
// app/api/lead/route.ts constructs `new Resend(process.env.RESEND_API_KEY)` at
// module scope, so these must be set before the route module is ever imported
// -- hence a setupFile rather than in-test stubbing.
//
// Two independent safety layers keep the suite from sending real mail:
//   1. these dummy values overwrite anything inherited from a real environment
//   2. the Resend client is mocked in the test file itself
// Layer 2 is the one that matters; layer 1 exists so that a future test which
// forgets to mock fails against a bogus key instead of delivering real mail
// through Erica's Resend account.
process.env.RESEND_API_KEY = "re_test_not_a_real_key";
process.env.BUSINESS_EMAIL = "business@invalid.test";
process.env.OPENAI_API_KEY = "sk-test-not-a-real-key";
