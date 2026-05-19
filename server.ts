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
        secret: process.env.SESSION_SECRET || "fallback-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'lax'
        }
    }));

    // --- AUTH ENDPOINTS ---
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

    // --- NEU: Account löschen ---
    app.delete("/api/auth/account", async (req: any, res) => {
        try {
            const userId = req.session.userId;
            if (!userId) return res.status(401).json({ error: "Nicht autorisiert" });

            // Dank 'onDelete: Cascade' in Prisma löscht dies auch alle Subjects, Deadlines, Scores und Collaborations des Users!
            await prisma.user.delete({ where: { id: userId } });

            req.session.destroy(() => res.json({ success: true }));
        } catch (error) {
            console.error("Fehler beim Löschen des Accounts:", error);
            res.status(500).json({ error: "Fehler beim Löschen des Accounts" });
        }
    });

    const requireAuth = (req: any, res: any, next: any) => {
        if (!req.session.userId) return res.status(401).json({ error: "Nicht autorisiert" });
        next();
    };

    // --- COLLABORATION ENDPOINTS ---

    app.post("/api/subjects/:id/share", requireAuth, async (req: any, res) => {
        try {
            const { partnerEmail } = req.body;
            const subjectId = req.params.id;
            const ownerId = req.session.userId;

            const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: ownerId } });
            if (!subject) return res.status(403).json({ error: "Nur Besitzer können den Kurs teilen." });

            const partner = await prisma.user.findUnique({ where: { email: partnerEmail.toLowerCase() } });
            if (!partner) return res.status(404).json({ error: "Nutzer nicht gefunden." });
            if (partner.id === ownerId) return res.status(400).json({ error: "Du kannst nicht mit dir selbst teilen." });

            await prisma.collaboration.upsert({
                where: { userId_subjectId: { userId: partner.id, subjectId } },
                update: { status: "PENDING" },
                create: { userId: partner.id, subjectId, status: "PENDING" }
            });

            res.json({ success: true });
        } catch (error) { res.status(500).json({ error: "Fehler beim Teilen" }); }
    });

    app.post("/api/subjects/:id/unshare", requireAuth, async (req: any, res) => {
        try {
            const { partnerEmail } = req.body;
            const subjectId = req.params.id;
            const ownerId = req.session.userId;

            const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: ownerId } });
            if (!subject) return res.status(403).json({ error: "Nur Besitzer können die Freigabe beenden." });

            const partner = await prisma.user.findUnique({ where: { email: partnerEmail.toLowerCase() } });
            if (!partner) return res.status(404).json({ error: "Nutzer nicht gefunden." });

            await prisma.collaboration.delete({
                where: { userId_subjectId: { userId: partner.id, subjectId } }
            });

            res.json({ success: true });
        } catch (error) { res.status(500).json({ error: "Fehler beim Beenden des Teilens" }); }
    });

    app.post("/api/invites/respond", requireAuth, async (req: any, res) => {
        try {
            const userId = req.session.userId;
            const { subjectId, accept } = req.body;

            if (accept) {
                await prisma.collaboration.update({
                    where: { userId_subjectId: { userId, subjectId } },
                    data: { status: "ACCEPTED" }
                });
            } else {
                await prisma.collaboration.delete({
                    where: { userId_subjectId: { userId, subjectId } }
                });
            }
            res.json({ success: true });
        } catch (error) { res.status(500).json({ error: "Fehler beim Antworten" }); }
    });

    // --- DATA ENDPOINTS ---

    app.get("/api/data", requireAuth, async (req: any, res) => {
        const userId = req.session.userId;
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                subjects: {
                    include: {
                        deadlines: true,
                        collaborators: { include: { user: true } }
                    }
                },
                collaborations: { include: { subject: { include: { deadlines: true, user: true } } } }
            }
        });

        const allCollabs = dbUser?.collaborations || [];

        const ownedSubjects = (dbUser?.subjects || []).map(s => ({
            ...s,
            isShared: false,
            collaborators: s.collaborators.map(c => ({ email: c.user.email, status: c.status }))
        }));

        const sharedSubjects = allCollabs
            .filter(c => c.status === "ACCEPTED")
            .map(c => ({
                ...c.subject,
                isShared: true,
                collaborators: []
            }));

        const allSubjects = [...ownedSubjects, ...sharedSubjects];

        const pendingInvites = allCollabs
            .filter(c => c.status === "PENDING")
            .map(c => ({
                subjectId: c.subject.id,
                subjectName: c.subject.name,
                ownerEmail: c.subject.user.email
            }));

        const allSubjectIds = allSubjects.map(s => s.id);
        const allScores = await prisma.score.findMany({
            where: { subjectId: { in: allSubjectIds } }
        });

        const formattedScores: any = {};
        allScores.forEach(s => { formattedScores[`${s.weekId}_${s.subjectId}_${s.type}`] = s.value; });

        res.json({
            subjects: allSubjects,
            pendingInvites,
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

                const ownedIncoming = (subjects || []).filter((s: any) => !s.isShared);
                const ownedIds = ownedIncoming.map((s: any) => s.id);

                await tx.subject.deleteMany({
                    where: { userId, id: { notIn: ownedIds } }
                });

                const sharedIncoming = (subjects || []).filter((s: any) => s.isShared);
                const sharedIds = sharedIncoming.map((s: any) => s.id);
                await tx.collaboration.deleteMany({
                    where: { userId, status: "ACCEPTED", subjectId: { notIn: sharedIds } }
                });

                // 1. Eigene Kurse upserten
                for (const sub of ownedIncoming) {
                    await tx.subject.upsert({
                        where: { id: sub.id },
                        update: { name: sub.name, threshold: sub.threshold, submissionUrl: sub.submissionUrl },
                        create: { id: sub.id, name: sub.name, threshold: sub.threshold, semesterId: sub.semesterId, submissionUrl: sub.submissionUrl, userId }
                    });

                    await tx.deadline.deleteMany({ where: { subjectId: sub.id } });
                    if (sub.deadlines?.length > 0) {
                        await tx.deadline.createMany({
                            data: sub.deadlines.map((d: any) => ({
                                id: d.id, title: d.title, date: d.date, time: d.time || null,
                                urgency: d.urgency || 3, completed: !!d.completed, subjectId: sub.id
                            }))
                        });
                    }
                }

                // 2. Geteilte Kurse updaten (URL, Threshold und Deadlines)
                for (const sub of sharedIncoming) {
                    const collab = await tx.collaboration.findUnique({
                        where: { userId_subjectId: { userId, subjectId: sub.id } }
                    });

                    if (collab && collab.status === "ACCEPTED") {
                        await tx.subject.update({
                            where: { id: sub.id },
                            data: { threshold: sub.threshold, submissionUrl: sub.submissionUrl }
                        });

                        await tx.deadline.deleteMany({ where: { subjectId: sub.id } });
                        if (sub.deadlines?.length > 0) {
                            await tx.deadline.createMany({
                                data: sub.deadlines.map((d: any) => ({
                                    id: d.id, title: d.title, date: d.date, time: d.time || null,
                                    urgency: d.urgency || 3, completed: !!d.completed, subjectId: sub.id
                                }))
                            });
                        }
                    }
                }

                // 3. Scores für alle aktualisieren
                const allSubIds = (subjects || []).map((s: any) => s.id);
                if (allSubIds.length > 0) {
                    await tx.score.deleteMany({ where: { subjectId: { in: allSubIds } } });
                    const scoreData = [];
                    for (const [key, value] of Object.entries(scores || {})) {
                        if (!value) continue;
                        const parts = key.split("_");
                        const type = parts.pop();
                        const subId = parts.pop();
                        const weekId = parts.join("_");
                        if (allSubIds.includes(subId)) {
                            scoreData.push({ weekId, subjectId: subId!, type: type!, value: String(value) });
                        }
                    }
                    if (scoreData.length > 0) await tx.score.createMany({ data: scoreData });
                }
            });
            res.json({ success: true });
        } catch (error) {
            console.error("Speicherfehler:", error);
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