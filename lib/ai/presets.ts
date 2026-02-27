export const INDUSTRY_PRESETS: Record<string, { keywords: string[] }> = {
    Restaurant: {
        keywords: ["fresh ingredients", "homemade", "daily specials", "reservations", "private dining", "catering", "family recipes", "seasonal menu"]
    },
    Dental: {
        keywords: ["comfortable experience", "gentle care", "new patients welcome", "same-day appointments", "smile", "oral health", "modern technology"]
    },
    HVAC: {
        keywords: ["same-day service", "licensed technicians", "24/7 emergency", "energy efficiency", "maintenance plan", "trusted local"]
    },
    Salon: {
        keywords: ["appointment availability", "skilled stylists", "color specialists", "relaxing atmosphere", "loyalty program"]
    }
};

export const TONE_GUIDES: Record<string, string> = {
    professional: "Structured sentences, formal vocabulary, third-person references to the team. Ideal for medical, legal, or financial services.",
    friendly: "Conversational, first-person plural ('we'), providing light warmth. Ideal for restaurants and retail.",
    casual: "Using contractions, short sentences, and relatable language. Ideal for service trades and gyms.",
    warm: "Emotionally expressive, gratitude-forward, and community-focused. Ideal for family businesses and salons."
};
