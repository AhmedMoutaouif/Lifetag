require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
const prisma = require("./prismaClient");
const { authMiddleware, adminMiddleware } = require("./middleware/auth");

const app = express();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
app.set("trust proxy", 1);

const normalizeOrigin = (url) => (typeof url === "string" ? url.replace(/\/$/, "") : "");

const allowedCorsOrigins = new Set(
    [
        normalizeOrigin(process.env.FRONTEND_URL),
        "https://getlifetag.com",
        "https://www.getlifetag.com",
        "https://main.lifetag-frontend.pages.dev",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ].filter(Boolean)
);

const isAllowedOrigin = (origin) => {
    if (!origin) return false;
    if (allowedCorsOrigins.has(origin)) return true;
    return /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
};

/** First middleware: CORS for browser + tunnel; handles OPTIONS before any other logic. */
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
        const requestedHeaders = req.headers["access-control-request-headers"];
        res.setHeader(
            "Access-Control-Allow-Headers",
            requestedHeaders || "Content-Type, Authorization, Accept, Accept-Language"
        );
        res.setHeader("Access-Control-Max-Age", "86400");
    }
    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }
    next();
});

const PLAN_LIMITS = {
    FREE: { allergies: 120, maladies: 200, medicaments: 180, additionalNotes: 160 },
    PREMIUM: { allergies: 2000, maladies: 5000, medicaments: 5000, additionalNotes: 5000 }
};

const getEffectivePlanType = (subscription) => {
    if (!subscription) return "FREE";
    const isActive = subscription.status === "active" && (!subscription.endDate || new Date(subscription.endDate) > new Date());
    return isActive && subscription.type === "PREMIUM" ? "PREMIUM" : "FREE";
};

const truncatePublicField = (val, max) => {
    if (val == null || val === "") return val;
    const s = String(val);
    return s.length <= max ? s : `${s.slice(0, max)}…`;
};

const MALADIES_FREE_PUBLIC_MAX = 120;
const limitMaladiesForFreePublic = (malStr) => {
    if (malStr == null || malStr === "") return malStr;
    try {
        const parsed = JSON.parse(malStr);
        const sel = Array.isArray(parsed.selected) ? parsed.selected.slice(0, 3) : [];
        let other = typeof parsed.other === "string" ? parsed.other : "";
        if (other.length > 40) other = `${other.slice(0, 40)}…`;
        const rebuilt = JSON.stringify(other ? { selected: sel, other } : { selected: sel });
        return rebuilt.length > MALADIES_FREE_PUBLIC_MAX
            ? truncatePublicField(rebuilt, MALADIES_FREE_PUBLIC_MAX)
            : rebuilt;
    } catch {
        return truncatePublicField(malStr, MALADIES_FREE_PUBLIC_MAX);
    }
};


const medicalDataForEmergencyScan = (medical, planType) => {
    if (!medical) return null;
    if (planType === "PREMIUM") {
        return { ...medical };
    }
    const L = PLAN_LIMITS.FREE;
    return {
        bloodGroup: medical.bloodGroup,
        contactName: medical.contactName,
        contactRelation: medical.contactRelation,
        contactPhone: medical.contactPhone,
        allergies: truncatePublicField(medical.allergies, L.allergies),
        maladies: limitMaladiesForFreePublic(medical.maladies),
        medicaments: truncatePublicField(medical.medicaments, L.medicaments),
        organDonor: medical.organDonor
    };
};

const enforcePlanLimits = (payload, planType) => {
    const limits = PLAN_LIMITS[planType] || PLAN_LIMITS.FREE;
    const fieldsToCheck = ["allergies", "maladies", "medicaments", "additionalNotes"];
    for (const field of fieldsToCheck) {
        const value = payload[field];
        if (typeof value === "string" && value.length > limits[field]) {
            const err = new Error(`La limite du plan ${planType} est depassee pour '${field}' (${limits[field]} caracteres max).`);
            err.statusCode = 400;
            throw err;
        }
    }
};

const activatePremiumForUser = async (userId) => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 3);

    const existingSubscription = await prisma.subscription.findFirst({ where: { userId } });
    const subscription = existingSubscription
        ? await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: { type: "PREMIUM", status: "active", startDate: now, endDate }
        })
        : await prisma.subscription.create({
            data: { userId, type: "PREMIUM", status: "active", startDate: now, endDate }
        });

    const existingCard = await prisma.card.findFirst({ where: { userId } });
    if (!existingCard) {
        await prisma.card.create({
            data: {
                userId,
                qrCode: `LT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                status: "validated"
            }
        });
    }

    return subscription;
};

const generateUniqueQrCode = async () => {
    // Retry on rare unique collisions.
    for (let i = 0; i < 10; i++) {
        const code = `LT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const existing = await prisma.card.findUnique({ where: { qrCode: code } });
        if (!existing) return code;
    }
    throw new Error("Impossible de générer un QR unique.");
};

app.use("/api/payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
    skip: (req) => req.method === "OPTIONS"
});
app.use("/api", limiter);

// Auth Routes
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, phone }
        });

        res.status(201).json({ message: "User registered successfully", userId: user.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: "Identifiants invalides" });
        if (user.status !== 'active') return res.status(403).json({ message: "Compte désactivé. Contactez l'admin." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Identifiants invalides" });

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Change Password (User)
app.post("/api/user/password", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Ancien mot de passe incorrect" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.userId },
            data: { password: hashedPassword }
        });
        res.json({ message: "Mot de passe modifié avec succès" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get User Profile
app.get("/api/user/profile", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, phone: true, role: true, status: true }
        });
        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Medical Data
app.get("/api/medical", authMiddleware, async (req, res) => {
    try {
        const [record, initialCard, subscription] = await Promise.all([
            prisma.medicalRecord.findUnique({ where: { userId: req.user.userId } }),
            prisma.card.findFirst({ where: { userId: req.user.userId } }),
            prisma.subscription.findFirst({ where: { userId: req.user.userId } })
        ]);
        const effectivePlanType = getEffectivePlanType(subscription);
        let card = initialCard;

        // Self-heal old premium accounts: ensure a physical card exists.
        if (!card && effectivePlanType === "PREMIUM") {
            card = await prisma.card.create({
                data: {
                    userId: req.user.userId,
                    qrCode: `LT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    status: "validated"
                }
            });
        }

        res.json({ record, card, subscription, effectivePlanType, limits: PLAN_LIMITS[effectivePlanType] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post("/api/medical", authMiddleware, async (req, res) => {
    try {
        const {
            allergies, maladies, medicaments, bloodGroup,
            sex, age, restingBloodPressure, cholesterol, maxHeartRate,
            oxygenSaturation, glucoseLevel, bodyTemperature,
            contactName, contactPhone, contactRelation,
            birthDate, weight, height, organDonor, additionalNotes
        } = req.body;

        const payload = {
            allergies, maladies, medicaments, bloodGroup,
            sex, age, restingBloodPressure, cholesterol, maxHeartRate,
            oxygenSaturation, glucoseLevel, bodyTemperature,
            contactName, contactPhone, contactRelation,
            birthDate, weight, height, organDonor, additionalNotes
        };

        const subscription = await prisma.subscription.findFirst({ where: { userId: req.user.userId } });
        const planType = getEffectivePlanType(subscription);
        if (planType === "FREE") {
            const existing = await prisma.medicalRecord.findUnique({ where: { userId: req.user.userId } });
            payload.additionalNotes = existing?.additionalNotes ?? "";
        }
        enforcePlanLimits(payload, planType);

        const record = await prisma.medicalRecord.upsert({
            where: { userId: req.user.userId },
            update: payload,
            create: { userId: req.user.userId, ...payload }
        });
        res.json({ message: "Medical data saved", record, effectivePlanType: planType, limits: PLAN_LIMITS[planType] });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Card Request
app.post("/api/request", authMiddleware, async (req, res) => {
    try {
        // Basic request, generating a pending card
        const card = await prisma.card.create({
            data: {
                userId: req.user.userId,
                qrCode: `temp_${Date.now()}_${req.user.userId}`, // Will be generated by admin later
                status: "pending"
            }
        });
        res.json({ message: "Card requested successfully", card });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// User: Generate or return a validated QR card
app.post("/api/card/generate", authMiddleware, async (req, res) => {
    try {
        const existingCard = await prisma.card.findFirst({ where: { userId: req.user.userId } });
        if (existingCard) {
            const updated = existingCard.status === "validated"
                ? existingCard
                : await prisma.card.update({
                    where: { id: existingCard.id },
                    data: { status: "validated" }
                });
            return res.json({ message: "Carte existante récupérée.", card: updated });
        }

        const qrCode = await generateUniqueQrCode();
        const card = await prisma.card.create({
            data: {
                userId: req.user.userId,
                qrCode,
                status: "validated"
            }
        });
        res.json({ message: "QR généré avec succès.", card });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: Generate QR
app.post("/api/qr", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { cardId, qrCodeValue } = req.body;
        const card = await prisma.card.update({
            where: { id: cardId },
            data: { qrCode: qrCodeValue, status: "validated" }
        });
        res.json({ message: "QR generated and card validated", card });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Emergency: Get info based on unique ID/QR
app.get("/api/emergency/:id", async (req, res) => {
    try {
        const card = await prisma.card.findUnique({
            where: { qrCode: req.params.id },
            include: {
                user: {
                    include: { medicalRecords: true }
                }
            }
        });

        if (!card || card.status !== "validated") {
            return res.status(404).json({ message: "Invalid or deactivated QR code" });
        }

        const subscription = await prisma.subscription.findFirst({ where: { userId: card.userId } });
        const effectivePlanType = getEffectivePlanType(subscription);
        const rawMedical = card.user.medicalRecords;
        const medicalData = medicalDataForEmergencyScan(rawMedical, effectivePlanType);

        res.json({
            name: card.user.name,
            medicalData,
            effectivePlanType,
            scanProfile: effectivePlanType === "PREMIUM" ? "full" : "limited"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Public contact form (landing page)
app.post("/api/contact", async (req, res) => {
    try {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
        const subject = typeof req.body.subject === "string" ? req.body.subject.trim().slice(0, 200) : null;

        if (name.length < 2 || name.length > 120) {
            return res.status(400).json({ message: "Nom invalide (2–120 caractères)." });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
            return res.status(400).json({ message: "Email invalide." });
        }
        if (message.length < 10 || message.length > 5000) {
            return res.status(400).json({ message: "Message invalide (10–5000 caractères)." });
        }

        const row = await prisma.contactMessage.create({
            data: { name, email, message, subject: subject || null, status: "new" }
        });
        res.status(201).json({ message: "Message reçu", id: row.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Create Stripe checkout session for premium activation
app.post("/api/payment/checkout-session", authMiddleware, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ message: "Stripe n'est pas configure sur le serveur." });
        }

        const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
        if (!priceId) {
            return res.status(500).json({ message: "STRIPE_PREMIUM_PRICE_ID manquant." });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: { userId: String(req.user.userId) },
            success_url: `${frontendBaseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendBaseUrl}/dashboard?payment=cancel`
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Confirm Stripe checkout and activate premium on return
app.post("/api/payment/confirm", authMiddleware, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ message: "Stripe n'est pas configure sur le serveur." });
        }

        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ message: "sessionId requis." });

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) {
            return res.status(400).json({ message: "Session Stripe introuvable." });
        }

        const isValidPayment =
            (session.mode === "payment" && session.payment_status === "paid") ||
            (session.mode === "subscription" && session.status === "complete");

        if (!isValidPayment) {
            return res.status(400).json({ message: "Paiement non valide." });
        }

        const expectedUserId = Number(session.metadata?.userId || "0");
        if (expectedUserId !== req.user.userId) {
            return res.status(403).json({ message: "Session Stripe invalide pour cet utilisateur." });
        }

        const subscription = await activatePremiumForUser(req.user.userId);

        res.json({ message: "Paiement confirme, premium active.", subscription });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Stripe webhook endpoint: auto-activate premium after successful checkout
app.post("/api/payment/webhook", async (req, res) => {
    try {
        if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
            return res.status(200).json({ received: true });
        }
        const sig = req.headers["stripe-signature"];
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            if (session.payment_status === "paid") {
                const userId = Number(session.metadata?.userId || "0");
                if (userId > 0) {
                    await activatePremiumForUser(userId);
                } else {
                    console.warn("Webhook checkout.session.completed recu sans metadata.userId valide");
                }
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error("Stripe webhook error:", error.message);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// Reclamation (Lost card)
app.post("/api/reclamation", authMiddleware, async (req, res) => {
    try {
        const { reason, description } = req.body;
        const reclamation = await prisma.reclamation.create({
            data: {
                userId: req.user.userId,
                reason,
                description,
                status: "pending"
            }
        });
        res.json({ message: "Reclamation submitted", reclamation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Deactivate QR
app.post("/api/qr/deactivate", authMiddleware, async (req, res) => {
    try {
        const { cardId } = req.body;
        const card = await prisma.card.updateMany({
            where: { id: cardId, userId: req.user.userId },
            data: { status: "deactivated" }
        });
        res.json({ message: "QR Code deactivated", card });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Admin Dashboard stats
app.get("/api/admin/stats", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [usersCount, cardsCount, subscriptionsCount, reclamationsCount, contactMessagesNewCount] = await Promise.all([
            prisma.user.count(),
            prisma.card.count(),
            prisma.subscription.count({ where: { type: 'PREMIUM' } }),
            prisma.reclamation.count({ where: { status: 'pending' } }),
            prisma.contactMessage.count({ where: { status: 'new' } })
        ]);
        res.json({ usersCount, cardsCount, subscriptionsCount, reclamationsCount, contactMessagesNewCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Admin Users List
app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                subscriptions: true,
                cards: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Admin Reclamations List
app.get("/api/admin/reclamations", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const reclamations = await prisma.reclamation.findMany({
            include: { user: true }
        });
        res.json(reclamations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Admin Resolve Reclamation
app.patch("/api/admin/reclamations/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const reclamation = await prisma.reclamation.update({
            where: { id: parseInt(req.params.id) },
            data: { status }
        });
        res.json(reclamation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Admin: messages contact (landing)
app.get("/api/admin/contact-messages", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const list = await prisma.contactMessage.findMany({
            orderBy: { createdAt: "desc" }
        });
        res.json(list);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.patch("/api/admin/contact-messages/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const status = req.body.status === "read" ? "read" : "new";
        const updated = await prisma.contactMessage.update({
            where: { id: parseInt(req.params.id, 10) },
            data: { status }
        });
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

const pickActiveSubscription = (user) => {
    if (!user?.subscriptions?.length) return null;
    return (
        user.subscriptions.find(
            (s) => s.status === "active" && (!s.endDate || new Date(s.endDate) > new Date())
        ) || null
    );
};

// Admin All Cards
app.get("/api/admin/cards", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const cards = await prisma.card.findMany({
            include: {
                user: {
                    include: {
                        medicalRecords: true,
                        subscriptions: true
                    }
                }
            }
        });
        const enriched = cards.map((c) => ({
            ...c,
            effectivePlanType: getEffectivePlanType(pickActiveSubscription(c.user))
        }));
        res.json(enriched);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Admin Update Card Status
app.patch("/api/admin/cards/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const card = await prisma.card.update({
            where: { id: parseInt(req.params.id) },
            data: { status }
        });
        res.json(card);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ADMIN: Manage Users (Update info/status/phone/password)
app.patch("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { name, role, status, phone, password } = req.body;
        const data = { name, role, status, phone };

        if (password && password.length > 0) {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(req.params.id) },
            data
        });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ADMIN: Delete User (cascade related rows: reclamations, cards, subscriptions, medical record)
app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);
        if (Number.isNaN(userId)) {
            return res.status(400).json({ error: "ID invalide" });
        }
        if (req.user.userId === userId) {
            return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
        }

        await prisma.$transaction(async (tx) => {
            await tx.reclamation.deleteMany({ where: { userId } });
            await tx.card.deleteMany({ where: { userId } });
            await tx.subscription.deleteMany({ where: { userId } });
            await tx.medicalRecord.deleteMany({ where: { userId } });
            await tx.user.delete({ where: { id: userId } });
        });

        res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
        console.error(error);
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }
        res.status(500).json({ error: error.message });
    }
});


// User Profile (Get current info)
app.get("/api/user/profile", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// User Update Profile
app.patch("/api/user/profile", authMiddleware, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: { name, phone }
        });
        res.json({ message: "Profile updated", user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// User My Reclamations
app.get("/api/reclamations", authMiddleware, async (req, res) => {
    try {
        const reclamations = await prisma.reclamation.findMany({
            where: { userId: req.user.userId }
        });
        res.json(reclamations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
