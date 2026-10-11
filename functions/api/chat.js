/**
 * ============================================================
 *  EIAI Chat API — Cloudflare Pages Function
 *  Route: POST /api/chat
 *  Path:  functions/api/chat.js
 * ============================================================
 *
 *  Environment variables (set in Cloudflare Dashboard):
 *    GROQ_API_KEY    — Groq API key (gsk_...)
 *    GEMINI_API_KEY  — Gemini API key (AQ....)
 *    GEMINI_MODEL    — Optional, default: gemini-3.5-flash
 *    APIFY_API_TOKEN — Optional, for SME opportunity search
 * ============================================================
 */

// ============================================================
// SYSTEM PROMPT
// ============================================================
const SYSTEM_PROMPT = `You are EIAI, the assistant for Edvance Innovators AI.

Your role is to help users with:
- Getting started with the EIAI platform
- Finding funding for projects (agriculture, textiles, IT, etc.)
- Connecting with experts across various domains
- Reducing worker churn and increasing productivity
- Project packages (manager-suggested and user-suggested)
- Media exchange and prototype manufacturing

Key domains you support:
- Agriculture & Agribusiness
- Textiles & Garment Manufacturing
- Retail & E-commerce
- Construction & Artisanal Trades
- IT & Digital Services
- Healthcare & Telemedicine
- Logistics & Last-mile Delivery
- Education & Vocational Training
- Renewable Energy Installation
- Tourism & Hospitality

Guidelines:
- Be helpful, concise, and professional
- Keep responses under 500 words
- Provide practical, actionable advice
- Never use markdown symbols like **, ##, *, or _ in your replies
- Use plain text with line breaks for structure
- Be culturally sensitive and inclusive

Current context: You are serving users in developing countries across Africa, Asia, and Latin America.`;

// ============================================================
// STATIC FALLBACK KNOWLEDGE BASE
// ============================================================
const STATIC_KB = [
    {
        keys: ['hello', 'hi', 'hey', 'greetings'],
        reply: 'Hello! Welcome to EIAI Hub. I am your AI assistant. Ask me about:\n- Getting started\n- Funding opportunities\n- Finding experts\n- Reducing churn\n- Project packages',
    },
    {
        keys: ['start', 'begin', 'getting started', 'new user', 'how to use'],
        reply: 'Getting started with EIAI is easy:\n\n1. Complete your profile with skills and location\n2. Browse available projects or post your own\n3. Connect with experts for mentorship\n4. Apply for funding from our financier network\n5. Track your productivity and reduce churn\n\nNeed help? Just ask!',
    },
    {
        keys: ['fund', 'finance', 'money', 'investor', 'capital', 'payment', 'financier'],
        reply: 'EIAI connects you with:\n- Diaspora investors\n- Impact funds\n- HNWIs (High Net Worth Individuals)\n- Development finance institutions\n\nHow it works:\n1. Post your project with clear milestones\n2. Financiers browse and select projects\n3. Funds are held in escrow\n4. Released as you complete deliverables\n\nTypical funding ranges: $2,000 to $100,000',
    },
    {
        keys: ['expert', 'mentor', 'consultant', 'advisor', 'guidance'],
        reply: 'Our expert network includes professionals from around the world:\n\n- Agriculture experts\n- Manufacturing specialists\n- IT and digital transformation consultants\n- Renewable energy engineers\n- Business development advisors\n\nExperts provide:\n- 1-on-1 mentorship sessions\n- Project reviews\n- Technical guidance\n- Strategy consulting',
    },
    {
        keys: ['churn', 'retention', 'turnover', 'staff', 'employee', 'worker'],
        reply: 'EIAI reduces churn by:\n\n- Identifying at-risk workers early (AI prediction)\n- Sending smart nudges via SMS/WhatsApp\n- Offering micro-tasks to reduce downtime\n- Connecting workers with mentors\n- Providing access to funding for growth\n\nResult: Companies see 15 to 40 percent reduction in churn within 3 months.',
    },
    {
        keys: ['package', 'template', 'suggest', 'recommend', 'bundle'],
        reply: 'EIAI offers AI-generated project packages:\n\nMANAGER-SUGGESTED:\n- Agri-Tech Starter: $5,000 to $15,000\n- Textile Efficiency Boost: $8,000 to $20,000\n- Solar Installation Training: $3,000 to $8,000\n\nUSER-SUGGESTED:\n- Digital Skills for Youth: $4,000 to $12,000\n\nUsers can also suggest their own packages. Top-voted packages get priority funding.',
    },
    {
        keys: ['manufactur', 'produce', 'factory', 'prototype', 'fabricate'],
        reply: 'EIAI Manufacturing Hub connects you with:\n\n- Local manufacturers in your country\n- Global production partners\n- 3D printing services for rapid prototypes\n- Sample production via Printful and partners\n\nHow it works:\n1. Upload your designs (CAD, 3D models, PDFs)\n2. Get quotes from verified manufacturers\n3. Compare pricing and lead times\n4. Fund production through EIAI escrow\n5. Track manufacturing progress',
    },
    {
        keys: ['upload', 'design', 'file', 'media', 'share'],
        reply: 'EIAI Media Exchange lets you:\n\n- Upload designs, documents, and prototypes\n- Share with experts for review\n- Collaborate with manufacturers\n- Version control for iterative design\n- Comment and approve changes\n\nSupported formats: CAD, 3D models, PDF, JPG, PNG, MP4, and more.',
    },
    {
        keys: ['productivity', 'efficiency', 'output', 'performance'],
        reply: 'EIAI boosts productivity through:\n\n- AI-powered task matching (reduce idle time)\n- Expert mentorship (learn faster)\n- Productivity analytics (see your trends)\n- Smart nudges (stay on track)\n- Collaborative project management\n\nUsers typically see 20 to 50 percent productivity improvement within 2 months.',
    },
    {
        keys: ['cost', 'price', 'free', 'pricing', 'fee', 'subscription'],
        reply: 'EIAI pricing:\n\nFREE Tier: Chat widget, browse projects, 1 active project\nPRO: $9 per month, unlimited projects, priority AI, analytics\nENTERPRISE: Custom, white-label, dedicated support\n\nTransaction fees: 2 to 5 percent on funded projects (paid by financier)\nExpert verification: $10 one-time (optional)',
    },
    {
        keys: ['thanks', 'thank you', 'appreciate'],
        reply: 'You are welcome! I am here to help. Is there anything else you would like to know about EIAI?',
    },
    {
        keys: ['bye', 'goodbye', 'see you', 'later', 'exit'],
        reply: 'Goodbye! Visit the EIAI Hub anytime. We are here to help you grow.',
    },
];

const STATIC_DEFAULT = "I am still learning. That question is not in my knowledge base yet. Please try asking about:\n- Getting started\n- Funding\n- Finding experts\n- Reducing churn\n- Project packages\n- Manufacturing\n\nOr email us at hello@edvanceinnovators.org";

// ============================================================
// QUERY CLASSIFIER
// ============================================================
function classifyQuery(message) {
    const lower = message.toLowerCase();
    const fundingKeywords = [
        'grant', 'funding', 'investor', 'capital', 'sme', 'msme',
        'loan', 'financing', 'opportunity', 'tender', 'accelerator',
        'seed', 'equity', 'development finance', 'world bank',
    ];
    if (fundingKeywords.some((k) => lower.includes(k))) {
        return 'funding';
    }
    return 'general';
}

function extractCountry(message) {
    const countries = {
        'kenya': 'KE', 'nigeria': 'NG', 'ghana': 'GH', 'rwanda': 'RW',
        'south africa': 'ZA', 'ethiopia': 'ET', 'tanzania': 'TZ',
        'uganda': 'UG', 'senegal': 'SN', 'ivory coast': 'CI',
        'cameroon': 'CM', 'zambia': 'ZM', 'zimbabwe': 'ZW',
        'india': 'IN', 'brazil': 'BR', 'mexico': 'MX',
        'philippines': 'PH', 'indonesia': 'ID', 'vietnam': 'VN',
    };
    const lower = message.toLowerCase();
    for (const [name, code] of Object.entries(countries)) {
        if (lower.includes(name)) return code;
    }
    return 'all';
}

// ============================================================
// MAIN HANDLER — POST /api/chat
// ============================================================
export async function onRequestPost(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    try {
        const body = await request.json();
        const message = (body.message || '').trim();
        const history = body.conversation_history || [];

        if (!message) {
            return new Response(
                JSON.stringify({ error: 'Message is required' }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Step 1: Classify
        const queryType = classifyQuery(message);

        // Step 2: Route funding questions to World Bank first
        if (queryType === 'funding') {
            const country = extractCountry(message);
            try {
                const wbReply = await fetchWorldBankData(country);
                if (wbReply) {
                    return new Response(
                        JSON.stringify({ reply: wbReply, source: 'world_bank' }),
                        { status: 200, headers: corsHeaders }
                    );
                }
            } catch (err) {
                console.error('World Bank failed:', err.message);
            }
        }

        // Step 3: Try Gemini first (usually more reliable)
        let reply = null;
        let source = null;

        if (env.GEMINI_API_KEY) {
            try {
                reply = await callGemini(env, message, history);
                source = 'gemini';
            } catch (err) {
                console.error('Gemini failed:', err.message);
            }
        }

        // Step 4: Try Groq second
        if (!reply && env.GROQ_API_KEY) {
            try {
                reply = await callGroq(env, message, history);
                source = 'groq';
            } catch (err) {
                console.error('Groq failed:', err.message);
            }
        }

        // Step 5: Static fallback
        if (!reply) {
            reply = getStaticFallback(message);
            source = 'static';
        }

        // Clean markdown from reply before returning
        reply = stripMarkdown(reply);

        return new Response(
            JSON.stringify({ reply, source }),
            { status: 200, headers: corsHeaders }
        );

    } catch (err) {
        console.error('Chat API error:', err);
        return new Response(
            JSON.stringify({
                reply: 'Sorry, an error occurred. Please try again.',
                error: err.message,
                source: 'error',
            }),
            { status: 500, headers: corsHeaders }
        );
    }
}

// ============================================================
// CORS PREFLIGHT
// ============================================================
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

// ============================================================
// GEMINI API
// ============================================================
async function callGemini(env, message, history) {
    const model = env.GEMINI_MODEL || 'gemini-3.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Build conversation context
    const parts = [SYSTEM_PROMPT, ''];
    for (const msg of history.slice(-6)) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        parts.push(`${role}: ${msg.content}`);
    }
    parts.push(`User: ${message}`);
    parts.push('Assistant:');
    const fullPrompt = parts.join('\n');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned no text');
    return text;
}

// ============================================================
// GROQ API
// ============================================================
async function callGroq(env, message, history) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-6),
        { role: 'user', content: message },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.7,
            max_tokens: 500,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq returned no text');
    return text;
}

// ============================================================
// WORLD BANK DATA (for funding questions)
// ============================================================
async function fetchWorldBankData(country = 'all') {
    const url = `https://api.worldbank.org/v2/country/${country}/indicator/NY.GDP.MKTP.CD?format=json&mrv=5&per_page=100`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) return null;

    const rows = data[1].filter((r) => r.value !== null);
    if (rows.length === 0) return null;

    let reply = 'World Bank Development Data:\n\n';
    for (const row of rows.slice(0, 5)) {
        const countryName = row.country?.value || 'Unknown';
        const year = row.date || 'N/A';
        const value = row.value;

        let formatted;
        if (value >= 1_000_000_000) {
            formatted = `$${(value / 1_000_000_000).toFixed(2)}B`;
        } else if (value >= 1_000_000) {
            formatted = `$${(value / 1_000_000).toFixed(2)}M`;
        } else {
            formatted = `$${value.toLocaleString()}`;
        }

        reply += `- ${countryName} (${year}): ${formatted}\n`;
    }

    reply += '\nData source: World Bank DataBank';
    return reply;
}

// ============================================================
// STATIC FALLBACK
// ============================================================
function getStaticFallback(message) {
    const lower = message.toLowerCase();
    for (const entry of STATIC_KB) {
        if (entry.keys.some((k) => lower.includes(k))) {
            return entry.reply;
        }
    }
    return STATIC_DEFAULT;
}

// ============================================================
// STRIP MARKDOWN
// ============================================================
function stripMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^\s*[\*\-\+]\s+/gm, '- ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''))
        .replace(/^>\s+/gm, '')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
