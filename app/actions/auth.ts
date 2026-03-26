"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, auth } from "@/auth";
import { db } from "@/lib/db";
import { businesses, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Session and Auth utilities for server side usage
export async function getSession() {
    return await auth();
}

// Sign out
export async function signOut() {
    await nextAuthSignOut({ redirect: false });
    redirect("/login");
}

// Update business settings
export async function updateBusinessSettings(
    businessId: string,
    data: {
        name?: string;
        industry?: string;
        tone?: string;
        keywords?: string[];
        responseLength?: "short" | "medium" | "long";
        autoRespond?: boolean;
        hipaaMode?: boolean;
        ownerName?: string;
        locationCity?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return { success: false, error: "Unauthorized" };

    try {
        await db.update(businesses)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(businesses.id, businessId), eq(businesses.userId, user.id)));

        revalidatePath("/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Create initial business profile during onboarding
export async function createBusiness(data: {
    name: string;
    industry: string;
    tone: string;
    keywords: string[];
    ownerName?: string;
}): Promise<{ success: boolean; businessId?: string; error?: string }> {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return { success: false, error: "Unauthorized" };

    try {
        const [business] = await db.insert(businesses)
            .values({
                ...data,
                userId: user.id,
            })
            .returning({ id: businesses.id });

        revalidatePath("/dashboard");
        return { success: true, businessId: business.id };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Complete onboarding
export async function completeOnboarding(): Promise<{ success: boolean }> {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) return { success: false };

    await db.update(users)
        .set({ onboardingCompleted: true })
        .where(eq(users.id, user.id));
        
    redirect("/dashboard");
}
