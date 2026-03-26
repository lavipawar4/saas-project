import { db } from "./lib/db";
import { users, businesses, subscriptions } from "./lib/db/schema";
import { eq } from "drizzle-orm";

async function setupTestData() {
  const allUsers = await db.select().from(users);
  console.log("Found users:", allUsers.map(u => ({ id: u.id, name: u.name, email: u.email })));

  const lavi = allUsers.find(u => u.email?.includes("lavi") || u.name?.includes("Lavi"));
  if (!lavi) {
    console.log("Lavi user not found.");
    return;
  }

  // 1. Set subscription to 'pro'
  await db.update(subscriptions)
    .set({ plan: "pro", responsesLimit: 1000, status: "active" })
    .where(eq(subscriptions.userId, lavi.id));
  console.log(`Updated subscription for ${lavi.name} to PRO.`);

  // 2. Set business to 'autoRespond'
  const laviBiz = await db.query.businesses.findFirst({
    where: eq(businesses.userId, lavi.id)
  });
  if (laviBiz) {
    await db.update(businesses)
      .set({ autoRespond: true, googleLocationName: "Test Location" })
      .where(eq(businesses.id, laviBiz.id));
    console.log(`Enabled auto-respond for business: ${laviBiz.name}`);
  }
}

setupTestData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
