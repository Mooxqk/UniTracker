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

    app.use(session({
        secret: process.env.SESSION_SECRET || "uni-tracker-ultra-secret-2026",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    }));

    // ==========================================
    // ÖFFENTLICHE AUTH-ROUTEN
    // ==========================================

    app.post("/api/auth/register", async (req, res) => {
        console.log("📩 Registrierungs-Anfrage erhalten:", req.body.email);
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: "E-Mail und Passwort fehlen" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    passwordHash: hashedPassword,
                    selectedProgramId: "inf",
                    selectedSemesterId: "ss26"
                }
            });

            (req.session as any).userId = user.id;
            console.log("✅ User registriert & Session erstellt:", user.email);
            res.json({ success: true });
        } catch (error: any) {
            console.error("❌ Fehler bei /register:", error);
            if (error.code === 'P2002') return res.status(400).json({ error: "E-Mail existiert bereits" });
            res.status(500).json({ error: "Datenbank-Fehler bei Registrierung" });
        }
    });

    app.post("/api/auth/login", async (req, res) => {
        console.log("📩 Login-Anfrage erhalten:", req.body.email);
        try {
            const { email, password } = req.body;

            // Check ob Daten überhaupt ankommen
            if (!email || !password) {
                console.log("⚠️ Login abgebrochen: Email oder Passwort fehlt");
                return res.status(400).json({ error: "E-Mail und Passwort erforderlich" });
            }

            const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

            if (!user || !user.passwordHash) {
                console.log("⚠️ Login fehlgeschlagen: User nicht gefunden oder kein Hash");
                return res.status(401).json({ error: "Ungültige Anmeldedaten" });
            }

            // Sicherer Vergleich
            const isMatch = await bcrypt.compare(password, user.passwordHash);

            if (isMatch) {
                (req.session as any).userId = user.id;
                console.log("✅ Login erfolgreich:", user.email);
                res.json({ success: true });
            } else {
                console.log("⚠️ Login fehlgeschlagen: Passwort falsch");
                res.status(401).json({ error: "Ungültige Anmeldedaten" });
            }
        } catch (error) {
            console.error("❌ Fehler bei /login:", error);
            res.status(500).json({ error: "Serverfehler beim Login" });
        }
    });

    app.get("/api/auth/me", async (req, res) => {
        const userId = (req.session as any).userId;
        if (!userId) return res.status(401).json({ loggedIn: false });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        res.json({ loggedIn: true, email: user?.email });
    });

    app.post("/api/auth/logout", (req, res) => {
        req.session.destroy(() => res.json({ success: true }));
    });

    // ==========================================
    // SCHUTZ-MIDDLEWARE
    // ==========================================
    const requireAuth = (req: any, res: any, next: any) => {
        if (!req.session.userId) {
            console.log("🚫 Zugriff verweigert: Keine Session");
            return res.status(401).json({ error: "Nicht autorisiert" });
        }
        next();
    };

    // ==========================================
    // GESCHÜTZTE DATEN-API
    // ==========================================

    app.get("/api/data", requireAuth, async (req: any, res) => {
        try {
            const userId = req.session.userId;
            const dbUser = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    subjects: { include: { deadlines: true } },
                    weeks: true,
                }
            });

            const allScores = await prisma.score.findMany({
                where: { subject: { userId: userId } }
            });

            const formattedScores: Record<string, string> = {};
            allScores.forEach(score => {
                formattedScores[`${score.weekId}_${score.subjectId}_${score.type}`] = score.value;
            });

            res.json({
                subjects: dbUser?.subjects || [],
                weeks: dbUser?.weeks || [],
                scores: formattedScores,
                selectedProgramId: dbUser?.selectedProgramId,
                selectedSemesterId: dbUser?.selectedSemesterId,
            });
        } catch (error) {
            console.error("❌ Fehler beim Laden der Daten:", error);
            res.status(500).json({ error: "Ladefehler" });
        }
    });

    app.post("/api/data", requireAuth, async (req: any, res) => {
        try {
            const userId = req.session.userId;
            const { subjects, weeks, scores, selectedProgramId, selectedSemesterId } = req.body;

            await prisma.$transaction(async (tx) => {
                await tx.user.update({ where: { id: userId }, data: { selectedProgramId, selectedSemesterId } });

                // Wir löschen nur die Daten des eingeloggten Users
                await tx.subject.deleteMany({ where: { userId: userId } });
                await tx.week.deleteMany({ where: { userId: userId } });

                if (weeks?.length) {
                    await tx.week.createMany({
                        data: weeks.map((w: any) => ({
                            id: w.id, name: w.name, date: w.date, semesterId: w.semesterId, userId
                        }))
                    });
                }

                for (const sub of subjects || []) {
                    const createdSubject = await tx.subject.create({
                        data: {
                            id: sub.id, name: sub.name, threshold: sub.threshold,
                            semesterId: sub.semesterId, submissionUrl: sub.submissionUrl, userId
                        }
                    });

                    if (sub.deadlines?.length) {
                        await tx.deadline.createMany({
                            data: sub.deadlines.map((d: any) => ({
                                id: d.id, title: d.title, date: d.date, completed: !!d.completed, subjectId: createdSubject.id
                            }))
                        });
                    }
                }

                const scoreEntries = Object.entries(scores || {});
                for (const [key, value] of scoreEntries) {
                    if (!value) continue;
                    const [weekId, subjectId, type] = key.split("_");
                    // Nur speichern wenn das Fach in dieser Transaction existiert
                    if (subjects.some((s: any) => s.id === subjectId) && weeks.some((w: any) => w.id === weekId)) {
                        await tx.score.create({ data: { weekId, subjectId, type, value: String(value) } });
                    }
                }
            });
            res.json({ success: true });
        } catch (error) {
            console.error("❌ Fehler beim Speichern:", error);
            res.status(500).json({ error: "Speicherfehler" });
        }
    });

    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
    }

    app.listen(PORT, () => console.log(`🚀 Server läuft auf http://localhost:${PORT}`));
}

startServer();