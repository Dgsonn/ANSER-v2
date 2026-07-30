export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seedDemoUser } = await import("@/server/store/users");
    const { ensureDefaultWarehouseAndBackfill, seedInitialData } = await import("@/server/store/seed");
    const { ensureCompanySettingsRow } = await import("@/server/store/settings");
    await seedDemoUser();
    await ensureDefaultWarehouseAndBackfill();
    await seedInitialData();
    await ensureCompanySettingsRow();
  }
}
