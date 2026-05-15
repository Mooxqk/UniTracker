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

    // --- NEU: Teilen-Endpunkt ---
    app.post("/api/subjects/:id/share", requireAuth, async (req: any, res) => {
        try {
            const { partnerEmail } = req.body;
            const subjectId = req.params.id;
            const ownerId = req.session.userId;

            // Prüfen, ob der Kurs einem selbst gehört
            const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: ownerId } });
            if (!subject) return res.status(403).json({ error: "Nur Besitzer können den Kurs teilen." });

            const partner = await prisma.user.findUnique({ where: { email: partnerEmail.toLowerCase() } });
            if (!partner) return res.status(404).json({ error: "Nutzer nicht gefunden." });
            if (partner.id === ownerId) return res.status(400).json({ error: "Du kannst den Kurs nicht mit dir selbst teilen." });

            // Verknüpfung erstellen (upsert verhindert Absturz bei doppelter Einladung)
            await prisma.collaboration.upsert({
                where: { userId_subjectId: { userId: partner.id, subjectId: subjectId } },
                update: {},
                create: { userId: partner.id, subjectId: subjectId }
            });

            res.json({ success: true });
        } catch (error) { res.status(500).json({ error: "Fehler beim Teilen" }); }
    });

    // --- GET DATA (Eigene + Geteilte Kurse laden) ---
    app.get("/api/data", requireAuth, async (req: any, res) => {
        const userId = req.session.userId;
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subjects: { include: { deadlines: true } },
                collaborations: { include: { subject: { include: { deadlines: true } } } }
            }
        });

        // Markiere geteilte Kurse für das Frontend
        const ownedSubjects = (dbUser?.subjects || []).map(s => ({ ...s, isShared: false }));
        const sharedSubjects = (dbUser?.collaborations || []).map(c => ({ ...c.subject, isShared: true }));
        const allSubjects = [...ownedSubjects, ...sharedSubjects];

        const allSubjectIds = allSubjects.map(s => s.id);
        const allScores = await prisma.score.findMany({
            where: { subjectId: { in: allSubjectIds } }
        });

        const formattedScores: any = {};
        allScores.forEach(s => { formattedScores[`${s.weekId}_${s.subjectId}_${s.type}`] = s.value; });

        res.json({
            subjects: allSubjects,
            weeks: [],
            scores: formattedScores,
            selectedSemesterId: dbUser?.selectedSemesterId,
        });
    });

    // --- POST DATA (Sicheres Speichern) ---
    app.post("/api/data", requireAuth, async (req: any, res) => {
        const userId = req.session.userId;
        const { subjects, scores, selectedSemesterId } = req.body;

        try {
            await prisma.$transaction(async (tx) => {
                await tx.user.update({ where: { id: userId }, data: { selectedSemesterId } });

                const ownedIncoming = (subjects || []).filter((s: any) => !s.isShared);
                const ownedIncomingIds = ownedIncoming.map((s: any) => s.id);

                // 1. Nur eigene gelöschte Kurse entfernen
                await tx.subject.deleteMany({
                    where: { userId: userId, id: { notIn: ownedIncomingIds } }
                });

                // 2. Eigene Kurse aktualisieren/erstellen
                for (const sub of ownedIncoming) {
                    await tx.subject.upsert({
                        where: { id: sub.id },
                        update: { name: sub.name, threshold: sub.threshold, submissionUrl: sub.submissionUrl },
                        create: { id: sub.id, name: sub.name, threshold: sub.threshold, semesterId: sub.semesterId, submissionUrl: sub.submissionUrl, userId }
                    });

                    // Deadlines für eigene Kurse neu schreiben
                    await tx.deadline.deleteMany({ where: { subjectId: sub.id } });
                    if (sub.deadlines && sub.deadlines.length > 0) {
                        await tx.deadline.createMany({
                            data: sub.deadlines.map((d: any) => ({
                                id: d.id, title: d.title, date: d.date, time: d.time || null,
                                urgency: d.urgency || 3, completed: !!d.completed, subjectId: sub.id
                            }))
                        });
                    }
                }

                // 3. Scores für ALLE Kurse (eigene + geteilte) aktualisieren
                const allIncomingSubjectIds = (subjects || []).map((s: any) => s.id);
                if (allIncomingSubjectIds.length > 0) {
                    await tx.score.deleteMany({ where: { subjectId: { in: allIncomingSubjectIds } } });
                }

                const scoreData = [];
                const scoreEntries = Object.entries(scores || {});
                for (const [key, value] of scoreEntries) {
                    if (!value) continue;
                    const parts = key.split("_");
                    const type = parts.pop();
                    const subIdInKey = parts.pop();
                    const weekId = parts.join("_");

                    if (allIncomingSubjectIds.includes(subIdInKey)) {
                        scoreData.push({ weekId, subjectId: subIdInKey!, type: type!, value: String(value) });
                    }
                }

                if (scoreData.length > 0) {
                    await tx.score.createMany({ data: scoreData });
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