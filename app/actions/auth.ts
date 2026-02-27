"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Login with email + password
export async function loginWithEmail(email: string, password: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    redirect("/dashboard");
}

// Sign up with email + password
export async function signUpWithEmail(email: string, password: string, fullName: string) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    return { success: true, message: "Check your email to confirm your account" };
}

// Sign out
export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
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
        response_length?: "short" | "medium" | "long";
        auto_respond?: boolean;
        hipaa_mode?: boolean;
        location_city?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from("businesses")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", businessId)
        .eq("user_id", user.id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/settings");
    return { success: true };
}

// Create initial business profile during onboarding
export async function createBusiness(data: {
    name: string;
    industry: string;
    tone: string;
    keywords: string[];
    owner_name?: string;
    location_city?: string;
}): Promise<{ success: boolean; businessId?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: business, error } = await supabase
        .from("businesses")
        .insert({ ...data, user_id: user.id })
        .select("id")
        .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard");
    return { success: true, businessId: business.id };
}

// Complete onboarding
export async function completeOnboarding(): Promise<{ success: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
    redirect("/dashboard");
}
