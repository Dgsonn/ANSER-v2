// Opt-in only — deliberately not keyed on NODE_ENV, since some staging/preview environments
// also report "production". Seeding creates demo data and a demo admin login, so it must never
// run silently against a real client database; set this explicitly per environment.
const STARTUP_SEED_ENABLED = process.env.ENABLE_STARTUP_SEED === "true";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && STARTUP_SEED_ENABLED) {
    const { runStartupSeed } = await import("@/server/store/seed");
    await runStartupSeed();
  }
}
