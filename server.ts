import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import session from "express-session";

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

async function startServer() {
    const app = express();
    app.use(express.json({ limit: '10mb' }));

    app.set('trust proxy', 1);

    app.use(session({
        secret: process.env.SESSION_SECRET || "fallback-nur-fuer-lokal",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'lax'
        }
    }));

    app.post("/api/auth/register", async (req, res) => {
        try {
            const { email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: { email: email.toLowerCase(), passwordHash: hashedPassword, selectedProgramId: "inf", selectedSemesterId: "ss26" }
            });
            (req.session as any).userId = user.id;
            res.json({ success: true });
        } catch (error) { res.status(400).json({ error: "Registrierung fehlgeschlagen" }); }
    });

    app.post("/api/auth/login", async (req, res) => {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (user && await bcrypt.compare(password, user.passwordHash)) {
            (req.session as any).userId = user.id;
            res.json({ success: true });
        } else { res.status(401).json({ error: "Ungültige Daten" }); }
    });

    app.get("/api/auth/me", async (req, res) => {
        const userId = (req.session as any).userId;
        if (!userId) return res.json({ loggedIn: false });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        res.json({ loggedIn: true, email: user?.email });
    });

    app.post("/api/auth/logout", (req, res) => {
        req.session.destroy(() => res.json({ success: true }));
    });

    const requireAuth = (req: any, res: any, next: any) => {
        if (!req.session.userId) return res.status(401).json({ error: "Nicht autorisiert" });
        next();
    };

    app.get("/api/data", requireAuth, async (req: any, res) => {
        const userId = req.session.userId;
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { subjects: { include: { deadlines: true } } }
        });

        const allScores = await prisma.score.findMany({
            where: { subject: { userId: userId } }
        });
        const formattedScores: any = {};
        allScores.forEach(s => { formattedScores[`${s.weekId}_${s.subjectId}_${s.type}`] = s.value; });

        res.json({
            subjects: dbUser?.subjects || [],
            weeks: [],
            scores: formattedScores,
            selectedSemesterId: dbUser?.selectedSemesterId,
        });
    });

    app.post("/api/data", requireAuth, async (req: any, res) => {
        const userId = req.session.userId;
        const { subjects, scores, selectedSemesterId } = req.body;

        try {
            await prisma.$transaction(async (tx) => {
                await tx.user.update({ where: { id: userId }, data: { selectedSemesterId } });

                await tx.deadline.deleteMany({ where: { subject: { userId } } });
                await tx.score.deleteMany({ where: { subject: { userId } } });
                await tx.subject.deleteMany({ where: { userId } });

                if (subjects && subjects.length >= 0) {
                    for (const sub of subjects) {
                        const createdSub = await tx.subject.create({
                            data: {
                                id: sub.id,
                                name: sub.name,
                                threshold: sub.threshold,
                                semesterId: sub.semesterId,
                                submissionUrl: sub.submissionUrl,
                                userId,
                                deadlines: {
                                    create: (sub.deadlines || []).map((d: any) => ({
                                        id: d.id,
                                        title: d.title,
                                        date: d.date,
                                        time: d.time || null,
                                        urgency: d.urgency || 3, // Fallback auf Grün (3)
                                        completed: !!d.completed,
                                    }))
                                }
                            }
                        });

                        const scoreEntries = Object.entries(scores || {});
                        for (const [key, value] of scoreEntries) {
                            if (!value) continue;
                            const parts = key.split("_");
                            const type = parts.pop();
                            const subIdInKey = parts.pop();
                            const weekId = parts.join("_");

                            if (subIdInKey === sub.id) {
                                await tx.score.create({
                                    data: { weekId, subjectId: createdSub.id, type: type!, value: String(value) }
                                });
                            }
                        }
                    }
                }
            });
            res.json({ success: true });
        } catch (error) {
            console.error("Transaktionsfehler:", error);
            res.status(500).json({ error: "Speicherfehler" });
        }
    });

    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
        app.use(vite.middlewares);
    } else {
        const distPath = path.resolve(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
    }

    app.listen(PORT, () => console.log(`🚀 Server online: Port ${PORT}`));
}

startServer().catch(console.error);