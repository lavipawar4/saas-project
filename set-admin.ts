import { db } from "./lib/db";
import { users } from "./lib/db/schema";
import { eq } from "drizzle-orm";

async function setAdmin() {
    const email = "pawarlavi928@gmail.com";
    console.log(`Setting ${email} as admin...`);
    
    try {
        const result = await db.update(users)
            .set({ role: "admin" })
            .where(eq(users.email, email))
            .returning();
            
        if (result.length > 0) {
            console.log("Success! User is now an admin.");
        } else {
            console.log("User not found. Try logging in first to create the record.");
        }
    } catch (error) {
        console.error("Error setting admin:", error);
    }
}

setAdmin();
