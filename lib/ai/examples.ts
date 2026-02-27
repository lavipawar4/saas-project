/**
 * Industry-specific few-shot examples: review → ideal response pairs.
 * 3-5 examples per industry. Updated quarterly.
 * These examples teach Claude what "natural" sounds like for each business type.
 */

export interface FewShotExample {
    review: string;
    rating: number;
    response: string;
}

const examples: Record<string, FewShotExample[]> = {

    // ─────────────────────────── RESTAURANT ───────────────────────────
    restaurant: [
        {
            rating: 5,
            review: "Best pasta I've had outside of Italy. The carbonara was perfectly creamy and the service was attentive without being intrusive. We'll be back for date night.",
            response: "Maria, that's the kind of compliment that keeps our kitchen going late into the night! Our chef has been perfecting that carbonara for years — we're so glad it hit the mark. We can't wait to be part of your next date night. Ask for a window table next time and mention this review. See you soon! — Chef Marco & the team",
        },
        {
            rating: 4,
            review: "Food was excellent, especially the risotto. Service was a bit slow during the rush but the staff were friendly and apologetic. Would come back.",
            response: "David, we're really glad the risotto won you over — it's a labour of love on our end. You're absolutely right about the wait during peak hours; we're working on smoother table flow and your feedback is exactly why. We'd love the chance to give you the full experience. Next time, let us know you're coming and we'll make sure the timing is as good as the food.",
        },
        {
            rating: 3,
            review: "Mixed experience. The appetizers were great but my steak was overcooked and it took a while to get it corrected. Staff handled it well though.",
            response: "James, we really appreciate you being candid with us. Getting a steak right matters, and we fell short there — even if the team handled the recovery well. That's not the standard we hold ourselves to. If you're willing to give us another shot, please reach out directly at hello@restaurant.com and we'll make sure your next visit is the one you were hoping for.",
        },
        {
            rating: 1,
            review: "Waited over an hour for our food, no explanation given. When it arrived it was cold. Manager was dismissive when we raised it.",
            response: "We're genuinely sorry about what you experienced — a long unexplained wait and cold food is unacceptable, and a dismissive response from management makes it worse. This is not who we want to be. We'd very much like to hear more about your visit and make it right. Please contact us directly at feedback@restaurant.com — we take this seriously.",
        },
        {
            rating: 5,
            review: "Perfect brunch spot. The eggs benedict were rich and well-seasoned. Great coffee too. My toddler was welcomed warmly which made all the difference.",
            response: "Sophie, knowing your little one felt at home here genuinely made our day — that's exactly the kind of atmosphere we work hard to create. The eggs benedict are one of our weekend highlights, so we're thrilled they landed well. We look forward to welcoming the whole family back soon!",
        },
    ],

    // ─────────────────────────── DENTAL ───────────────────────────────
    dental: [
        {
            rating: 5,
            review: "Hadn't been to the dentist in years due to anxiety. The team were incredibly patient and explained everything before they did it. Left feeling proud of myself.",
            response: "Thank you so much for sharing this — courage like yours is something we admire deeply, and it means everything to know the team made you feel supported rather than judged. We'd love to continue being part of your journey toward a healthy smile. We're always here whenever you're ready, and we'll take it at your pace. — Dr. Patel & the team",
        },
        {
            rating: 5,
            review: "Efficient, professional, and surprisingly painless. The hygienist was thorough and gave me useful tips without being preachy.",
            response: "Rachel, 'surprisingly painless' might be our favourite description we've ever received! Our hygiene team works hard to make sure every visit feels comfortable rather than daunting, and useful guidance without the lecture is very much the goal. We'll look forward to seeing you at your next check-up.",
        },
        {
            rating: 4,
            review: "Good overall experience. Waiting room was a bit cramped and the wait was longer than expected but the actual appointment was great.",
            response: "We really appreciate you sharing this honestly. The waiting area and scheduling flow are areas we know need attention, and feedback like yours helps us prioritise. Glad the appointment itself met expectations — that's always our goal. We hope to make the full experience just as smooth next time.",
        },
        {
            rating: 3,
            review: "The dentist was fine but I felt rushed and didn't get answers to questions I had. Front desk was great.",
            response: "Your concerns deserve proper answers — always. We're sorry that didn't happen on this visit. If you have questions you'd like addressed, please don't hesitate to call the office directly and we'll book time specifically to go through everything with you. A comfortable, informed patient makes for better care, and we want to do better.",
        },
        {
            rating: 1,
            review: "Had to wait 45 minutes past my appointment. No one acknowledged the delay until I asked. Really poor experience.",
            response: "We're truly sorry your time wasn't respected — 45 minutes without acknowledgment is unacceptable and that's on us. We understand how frustrating that must have been. We'd welcome the chance to speak with you directly about what happened; please call us at your convenience and ask for the practice manager. We want to make it right.",
        },
    ],

    // ─────────────────────────── HOTEL ────────────────────────────────
    hotel: [
        {
            rating: 5,
            review: "Stayed for our anniversary. The room had champagne and flowers waiting — a complete surprise. Staff remembered our names throughout. Exceptional.",
            response: "Elena and Michael, anniversaries are made for moments exactly like this, and we're so glad we could play a small part in yours. Our team puts genuine care into every personalised detail, so it's wonderful to hear it came together. Congratulations again — we hope to celebrate many more milestones with you. — The Front Desk Team",
        },
        {
            rating: 5,
            review: "Clean, modern rooms and a fantastic location. Breakfast was excellent — the smoked salmon was standout. Would absolutely return.",
            response: "Tom, we're so glad the smoked salmon made an impression — our breakfast team takes real pride in sourcing quality ingredients and it shows when guests notice the details. Location-wise, we think we're rather well-placed ourselves! We'll look forward to welcoming you back.",
        },
        {
            rating: 4,
            review: "Great stay overall. The pool area was a bit noisy in the evenings but the room and breakfast were both excellent.",
            response: "Claire, we're glad the room and breakfast more than delivered. You make a fair point about the evening pool atmosphere — it can get lively on weekends, and we recognise that's not ideal for everyone. Worth mentioning on your next booking so we can suggest a quieter room aspect. Hope to have you back soon.",
        },
        {
            rating: 2,
            review: "Room wasn't ready until 5pm despite 3pm check-in. The AC barely worked and housekeeping didn't replenish toiletries the whole stay.",
            response: "We're genuinely sorry. A late room, unreliable air conditioning and missed housekeeping on a multi-night stay falls well short of what you deserved. These are operational failures and we own that. We'd welcome the chance to discuss your stay further — please reach out to guest.relations@hotel.com and a member of our team will respond personally.",
        },
        {
            rating: 3,
            review: "Average stay. Nothing particularly wrong but nothing that stood out either. Room was clean but dated.",
            response: "We appreciate the honest perspective, Ben. 'Nothing wrong' is a reasonable starting point but you deserve more than average. Room refresh is something we're actively working through, and feedback like yours keeps us honest on pace. If you return, we'd genuinely enjoy the chance to show you a more memorable visit.",
        },
    ],

    // ─────────────────────────── RETAIL ───────────────────────────────
    retail: [
        {
            rating: 5,
            review: "Found exactly what I was looking for and the staff helped me compare options without any pressure. Bought something slightly better than planned and glad I did.",
            response: "That's brilliant to hear, Lena! Our team really does love helping people find the right fit — not just the first thing they see. No pressure, just good conversation and honest advice. Enjoy your new purchase and come back anytime you need a second opinion.",
        },
        {
            rating: 5,
            review: "Excellent customer service when I needed to return something. No fuss, quick, and the staff member was warm and helpful. Rare to see these days.",
            response: "Returns shouldn't be an ordeal — we couldn't agree more. We're really glad the team handled it the way you'd want and the way we'd want for ourselves. It means a lot when that gets noticed. We hope to see you again under happier shopping circumstances.",
        },
        {
            rating: 4,
            review: "Good range of products and helpful staff. Queues at checkout were quite long on a Saturday which was the only downside.",
            response: "Saturdays do test us! We're working on better queue management for peak periods, and your feedback is genuinely useful in making the case internally. Really glad the range and service were on point otherwise — that's what we care about most.",
        },
        {
            rating: 2,
            review: "Ordered online, arrived damaged. Return process was frustrating — multiple emails and no resolution after 10 days.",
            response: "We're really sorry, Paul. Receiving a damaged item is bad enough — having to chase a resolution for 10 days without result is something we take seriously and want to fix. Please email us directly at orders@store.com with your order number and we'll personally take ownership of sorting this today.",
        },
        {
            rating: 3,
            review: "Decent selection but the store layout made it hard to find things and there wasn't enough staff on the floor to help.",
            response: "That's fair feedback and exactly the kind of thing we need to hear. Store navigation and floor coverage are both things we're actively reviewing, and knowing it affected your experience is genuinely helpful. We hope you'll give us another chance — and that next time, finding what you need is half the effort.",
        },
    ],

    // ─────────────────────────── HEALTHCARE / MEDICAL ─────────────────
    healthcare: [
        {
            rating: 5,
            review: "I was nervous coming in but the whole team put me at ease. Very professional and thorough. I left feeling genuinely cared for.",
            response: "We're so glad your experience felt that way — creating a calm, reassuring environment is something every member of our team works hard at every day. It's a privilege to play a role in your care, and we're here whenever you need us. — The care team",
        },
        {
            rating: 5,
            review: "Quick appointment, no long wait, and the staff were friendly and efficient. Exactly what you want from a healthcare visit.",
            response: "Karen, your time matters and we're glad we respected it. Efficient and friendly isn't always easy to achieve together, so it's gratifying to hear both landed well. We'll look forward to being there whenever you need us.",
        },
        {
            rating: 4,
            review: "Very caring staff. Parking is a nightmare though which made the whole visit more stressful than it needed to be.",
            response: "Parking stress before an appointment is the last thing anyone needs — you're right and we hear this often enough that we're actively working with the building management on options. We're glad the care itself felt supportive, and we hope a smoother arrival next time lets that be the whole story.",
        },
        {
            rating: 3,
            review: "The staff were kind but I felt my concerns weren't fully listened to. I had to repeat myself a few times.",
            response: "Feeling heard is fundamental to good care — and if that didn't happen for you, we want to know about it and do better. We'd welcome a direct conversation to understand your experience further. Please feel free to call the office and ask for our patient liaison team; they're here specifically for moments like this.",
        },
        {
            rating: 1,
            review: "Waited over two hours with no update. When I asked the reception they were dismissive. Not acceptable.",
            response: "A two-hour wait with no communication and an unhelpful response when you asked — that's not acceptable, and we understand why you're frustrated. We'd like to speak with you directly about what happened. Please contact us at care@clinic.com and a senior team member will be in touch promptly.",
        },
    ],

    // ─────────────────────────── LEGAL / LAW FIRM ─────────────────────
    legal: [
        {
            rating: 5,
            review: "Handled our property purchase professionally and efficiently. Kept us informed at every stage. Would recommend without hesitation.",
            response: "Thank you, James — being transparent at every stage of a property transaction is something we consider non-negotiable. We're glad the process felt manageable and that the outcome met your expectations. Should you need our assistance in future, we'll be here. — The conveyancing team",
        },
        {
            rating: 5,
            review: "Excellent advice during a difficult time. The solicitor was clear, empathetic and didn't make me feel rushed despite how busy they were.",
            response: "Navigating a difficult situation with clarity and care at the same time is exactly what we strive for. It means a great deal to know that came through. Our team is always here should you need us again.",
        },
        {
            rating: 4,
            review: "Generally very good service. Response times to emails could be faster but the legal advice itself was solid and the outcome was positive.",
            response: "We're pleased the advice and outcome delivered — that's always the priority. Your point on email response times is noted; we're reviewing our communication process and this kind of feedback helps us sharpen it. Thank you for taking the time to share it.",
        },
        {
            rating: 3,
            review: "Felt like a small fish in a big pond. Service was fine but impersonal. Didn't feel like my case had individual attention.",
            response: "That's something we care deeply about getting right, and we're sorry your experience didn't reflect it. Every client deserves to feel that their matter is treated with personal attention — if you're open to it, we'd welcome a conversation about how we can do better for you going forward. Please don't hesitate to contact us directly.",
        },
        {
            rating: 2,
            review: "Communication was very poor throughout. Had to chase for updates repeatedly. The end result was fine but the process was stressful.",
            response: "We understand how frustrating poor communication can be, particularly in legal matters where uncertainty is already stressful. The outcome being positive is something we're glad of, but we recognise the process should have been far smoother. We'd welcome the opportunity to hear more about your experience — please contact the office and ask for the client relations lead.",
        },
    ],

    // ─────────────────────────── GYM / FITNESS ────────────────────────
    "gym & fitness": [
        {
            rating: 5,
            review: "Joined three months ago and already seeing real results. Trainers are knowledgeable and encouraging without being pushy. Clean facilities.",
            response: "Three months and already feeling results — that's exactly where the hard work starts to pay off! Our trainers genuinely care about getting it right for each individual, and clean facilities are something we take seriously every day. Keep going — we're rooting for you every session.",
        },
        {
            rating: 5,
            review: "Best gym I've been a member of. Never too crowded even at peak times and the equipment is always maintained and available.",
            response: "Niall, equipment access and a non-overcrowded floor are two things we actively manage — so it's great to hear it's working. We've got a lot of members who've passed up bigger gyms for exactly that reason. Glad you made the switch.",
        },
        {
            rating: 4,
            review: "Love the classes and instructors. Changing rooms could do with an upgrade though — the lockers are a bit battered.",
            response: "The changing rooms are on our list — you're not the first to mention the lockers and it's feedback we're taking forward to our facilities review this quarter. Classes and instructors getting a strong nod means a lot to the team. We'll get the rest there.",
        },
        {
            rating: 2,
            review: "Equipment frequently out of order and it takes ages to get fixed. For the price, expectations are higher.",
            response: "Equipment reliability is non-negotiable and we're not meeting the mark right now — we hear you. We're mid-way through a maintenance overhaul and your feedback is a fair reminder of the urgency. If specific equipment has been a problem, please flag it to the front desk so we can prioritise. We appreciate your patience while we sort this.",
        },
        {
            rating: 3,
            review: "Decent gym but the PT sessions felt generic. Not enough personalisation for the price point.",
            response: "Personalisation is what separates a good PT session from a great one, and if that wasn't coming through, that's something we want to address. We'd welcome the chance to have a conversation with you about what you're looking for — speak to our head trainer and let's build a programme that actually fits you.",
        },
    ],

    // ─────────────────────────── SPA & BEAUTY ─────────────────────────
    "spa & beauty": [
        {
            rating: 5,
            review: "Had the hot stone massage and left feeling completely renewed. The therapist was skilled and the atmosphere was genuinely relaxing — no loud music, perfect temperature.",
            response: "Anya, 'completely renewed' is the highest praise we could hope for. The little things — the music, the temperature, the pace — are carefully thought through to create exactly that feeling. Your therapist will be so glad to hear the session landed the way it was intended. We'll look forward to your next visit.",
        },
        {
            rating: 5,
            review: "Treated myself to a facial for my birthday and it was absolutely worth it. Skin felt incredible for days after.",
            response: "Happy birthday, Lauren! A facial that lasts days — that's a sign everything from the products to the technique was working in harmony. We love being part of a birthday celebration. Hope to see you back soon, whether it's a special occasion or just because you deserve it.",
        },
        {
            rating: 4,
            review: "Lovely experience overall. The treatment room was slightly cold at the start but warmed up. Therapist was wonderful.",
            response: "Fiona, a cold start to a treatment is entirely our responsibility to get right — thank you for mentioning it. We'll make sure the room is properly pre-warmed before each session going forward. Glad the therapist made the rest of it lovely — she genuinely loves what she does, and it shows.",
        },
        {
            rating: 3,
            review: "Nice enough but I felt a bit rushed. For a relaxing spa experience, the transitions felt very hurried.",
            response: "The pace of a spa experience is something we take seriously — rushing takes all the calm out of it. We're sorry the transitions didn't give you the breathing room you deserved. If you'd like to return, do let us know and we'll make sure the timing is properly managed. That's the experience we want you to have.",
        },
        {
            rating: 2,
            review: "Booked two weeks in advance and arrived to find my appointment wasn't in the system. Had to wait 30 minutes before being seen.",
            response: "That's a genuinely poor experience and we're very sorry. Arriving for an appointment you planned ahead and finding it wasn't in the system — then waiting — is not how anyone should feel before a relaxing treatment. We'd like to make this right; please get in touch with us directly and we'll arrange something that reflects how seriously we take this.",
        },
    ],

    // ─────────────────────────── REAL ESTATE ──────────────────────────
    "real estate": [
        {
            rating: 5,
            review: "Sold our home in under two weeks for above asking price. The team's market knowledge and staging advice made all the difference.",
            response: "Under two weeks and above asking — that's a result we're genuinely proud of, but it started with you trusting us with the process. Knowing the market and helping homes show at their best are both things we invest heavily in. Congratulations on the sale, and we hope the next chapter is everything you're hoping for. — The sales team",
        },
        {
            rating: 5,
            review: "As a first-time buyer, I was nervous about the whole process. The agent was patient, explained every step, and never made me feel foolish for asking questions.",
            response: "First-time buying is genuinely complex and there's no such thing as a silly question — we mean that. It's wonderful to hear the process felt manageable rather than overwhelming. Congratulations on your first home; it's a big deal and you should feel proud. We're here if you need us for anything going forward.",
        },
        {
            rating: 4,
            review: "Good communication throughout the sale. Could have had a bit more guidance on the final legal stages but overall a positive experience.",
            response: "Really glad the communication worked well — that's often where sales either feel smooth or not. Your point on the legal stage guidance is well taken; it's an area we can do more to walk clients through. We'll use that when training the team. Congratulations on completing the sale.",
        },
        {
            rating: 2,
            review: "Viewings were poorly managed and we received conflicting information from different agents. Lost confidence in the process.",
            response: "Conflicting information and disorganised viewings are exactly the kinds of things that erode confidence in a transaction — and rightly so. We're sorry this was your experience. We'd genuinely like to understand more about what happened; please contact us directly and ask to speak with the branch manager.",
        },
        {
            rating: 5,
            review: "Found us the perfect rental in a very tricky market. Listened to exactly what we needed and didn't waste our time with irrelevant properties.",
            response: "In a tough rental market, respecting what you're actually looking for really is half the battle. We're so glad the right place came through and that we could be part of making it happen. Enjoy your new home, and don't hesitate to get in touch whenever you need us again.",
        },
    ],

    // ─────────────────────────── AUTOMOTIVE ───────────────────────────
    automotive: [
        {
            rating: 5,
            review: "MOT and service done quickly, clearly explained, no surprises on the bill. That's all you can ask for from a garage.",
            response: "No surprises on the bill — honestly, that's the goal every time, so we're really glad it landed that way. Clear communication before any work begins is something we consider non-negotiable. Thanks for trusting us with your car, and we'll see you at the next service.",
        },
        {
            rating: 5,
            review: "Fixed an intermittent fault that three other garages couldn't identify. Impressed by both the diagnosis and the communication throughout.",
            response: "Intermittent faults are among the trickiest things to pin down, so the team will be particularly glad to hear this one got sorted. Good diagnosis depends on experience and good listening — and clear communication throughout makes all the difference. Thanks for your patience during the process.",
        },
        {
            rating: 4,
            review: "Good work overall but the car wasn't ready when promised. Had to arrange a lift back which was inconvenient.",
            response: "An overrun on the promised time is something we know causes real inconvenience, especially when it affects your plans. That's on us, and we should have called ahead the moment we knew. Your feedback will help us sharpen that. Really glad the work itself was to the standard you expected.",
        },
        {
            rating: 2,
            review: "Paid for a full service. Noticed the washer fluid hadn't been topped up and a bulb I flagged wasn't checked. Feels like corners were cut.",
            response: "If things were flagged and not addressed, that's not the standard of service you paid for or that we want to deliver. We'd really like to look into this specifically — please contact us with your booking details and we'll review what was completed and make it right.",
        },
        {
            rating: 3,
            review: "Work was fine but the waiting area isn't great and I waited longer than quoted for a simple job.",
            response: "Waiting room comfort and accurate time estimates are both things we're actively improving — feedback like yours is exactly what steers those priorities. Glad the work was sound. We hope the next visit gives you a smoother experience from start to finish.",
        },
    ],

    // ─────────────────────────── EDUCATION ───────────────────────────
    education: [
        {
            rating: 5,
            review: "My son passed his exam after weeks of tutoring here. The tutors are patient, knowledgeable, and genuinely invested in students' success.",
            response: "Congratulations to your son — that result reflects real hard work on his part, and we're so glad our tutors could support the journey. Seeing students move from uncertainty to confidence is exactly why we do this. We wish him every success ahead.",
        },
        {
            rating: 5,
            review: "Enrolled my daughter in the Saturday programme. She actually looks forward to it. First time she's been enthusiastic about learning in years.",
            response: "A child looking forward to learning — that's the result we're most proud of, beyond any exam result. Something clicked for her, and that's a wonderful thing to see. We'll work hard to keep that momentum going. Thank you for sharing this.",
        },
        {
            rating: 4,
            review: "Good quality teaching. The scheduling system could be more flexible for working parents.",
            response: "Scheduling flexibility for working parents is an area we're actively looking at — you're not the first to raise it and it's genuinely on our roadmap. Really glad the teaching quality is working well for your family. We'll aim to make the logistics match.",
        },
        {
            rating: 3,
            review: "No issues with the teaching but communication from admin was slow and inconsistent.",
            response: "That's genuinely important feedback. Clear and timely communication from our team is something students and parents absolutely deserve, and if it fell short, we want to fix it. Please reach out directly and we'll make sure your account is managed properly going forward.",
        },
        {
            rating: 2,
            review: "My child wasn't making progress and when I raised it, I didn't feel heard. Ended up leaving.",
            response: "We're sorry we let you both down, and sorrier still that raising a concern wasn't met with a proper response. Every student deserves to make progress and every parent deserves to feel heard. If you'd be open to it, we'd like to understand what happened — please do reach out.",
        },
    ],
};

/**
 * Get few-shot examples for an industry, with fallback to restaurant examples.
 */
export function getIndustryExamples(industry: string): FewShotExample[] {
    const key = industry.toLowerCase().trim();

    // Exact match
    if (examples[key]) return examples[key];

    // Partial match (e.g. "dental practice" → "dental")
    for (const [k, v] of Object.entries(examples)) {
        if (key.includes(k) || k.includes(key)) return v;
    }

    // Default fallback
    return examples.restaurant;
}
