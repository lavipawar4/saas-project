"use server";

import { createClient } from "@/lib/supabase/server";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/email/resend";
import { revalidatePath } from "next/cache";

export async function addCustomer(businessId: string, formData: FormData) {
    const supabase = await createClient();
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const tagsStr = formData.get("tags") as string;
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];

    const { error } = await supabase
        .from("customers")
        .insert({
            business_id: businessId,
            full_name: fullName,
            email,
            phone,
            tags
        });

    if (error) {
        console.error("Error adding customer:", error);
        return { error: error.message };
    }

    revalidatePath("/dashboard/customers");
    return { success: true };
}

export async function deleteCustomer(customerId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/customers");
    return { success: true };
}

export async function sendReviewRequest(customerId: string, businessId: string) {
    const supabase = await createClient();

    // 1. Get customer and business info
    const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

    const { data: business } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

    if (!customer || !business) {
        return { error: "Customer or Business not found" };
    }

    // 2. Generate review link (mocking one for now, usually it's a Google Place ID link)
    // Example: https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID
    const reviewLink = business.google_location_id
        ? `https://search.google.com/local/writereview?placeid=${business.google_location_id}`
        : "https://g.page/review/direct"; // Fallback

    try {
        // 3. Send email via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: customer.email,
            subject: `Experience with ${business.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">Hi ${customer.full_name},</h2>
                    <p>Thank you for choosing <strong>${business.name}</strong>!</p>
                    <p>We'd love to hear about your experience. Would you mind taking a minute to leave us a review on Google?</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${reviewLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Leave a Review
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #666;">Your feedback helps us grow and serve you better.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999;">If you have any issues, please reply directly to this email.</p>
                </div>
            `
        });

        if (emailError) throw emailError;

        // 4. Log the request in DB
        await supabase
            .from("review_requests")
            .insert({
                customer_id: customerId,
                business_id: businessId,
                status: "sent",
                sent_at: new Date().toISOString(),
                email_id: emailData?.id
            });

        // 5. Update last interaction
        await supabase
            .from("customers")
            .update({ last_interaction_at: new Date().toISOString() })
            .eq("id", customerId);

        revalidatePath("/dashboard/customers");
        return { success: true };
    } catch (err: any) {
        console.error("Email send failed:", err);
        return { error: err.message };
    }
}
