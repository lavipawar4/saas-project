"use server";

import { db } from "@/lib/db";
import { customers, reviewRequests, businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/email/resend";
import { revalidatePath } from "next/cache";

export async function addCustomer(businessId: string, formData: FormData) {
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const tagsStr = formData.get("tags") as string;
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];

    try {
        await db.insert(customers).values({
            businessId,
            fullName,
            email,
            phone,
            tags,
        });

        revalidatePath("/dashboard/customers");
        return { success: true };
    } catch (error: any) {
        console.error("Error adding customer:", error);
        return { error: error.message };
    }
}

export async function deleteCustomer(customerId: string) {
    try {
        await db.delete(customers).where(eq(customers.id, customerId));
        revalidatePath("/dashboard/customers");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function sendReviewRequest(customerId: string, businessId: string) {
    try {
        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, customerId)
        });

        const business = await db.query.businesses.findFirst({
            where: eq(businesses.id, businessId)
        });

        if (!customer || !business) {
            return { error: "Customer or Business not found" };
        }

        const reviewLink = business.googleLocationId
            ? `https://search.google.com/local/writereview?placeid=${business.googleLocationId}`
            : "https://g.page/review/direct";

        if (!customer.email) {
            return { error: "Customer does not have an email" };
        }

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: customer.email,
            subject: `Experience with ${business.name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">Hi ${customer.fullName},</h2>
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

        await db.insert(reviewRequests).values({
            customerId,
            businessId,
            status: "sent",
            sentAt: new Date(),
            emailId: emailData?.id
        });

        await db.update(customers)
            .set({ lastInteractionAt: new Date() })
            .where(eq(customers.id, customerId));

        revalidatePath("/dashboard/customers");
        return { success: true };
    } catch (err: any) {
        console.error("Email send failed:", err);
        return { error: err.message };
    }
}
