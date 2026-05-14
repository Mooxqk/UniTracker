import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

async function startServer() {
    const app = express();
    app.use(express.json({ limit: '10mb' }));

    // Hilfsfunktion: Sucht den ersten User oder erstellt einen, falls keiner da ist
    async function getOrCreateDummyUser() {
        try {
            let user = await prisma.user.findFirst();
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: "admin@localhost",
                        passwordHash: "geheim", // Später echtes Hashing
                        selectedProgramId: "inf",
                        selectedSemesterId: "ss26"
                    }
                });
                console.log("✅ Dummy-User erstellt");
            }
            return user;
        } catch (e) {
            console.error("❌ Fehler beim User-Check:", e);
            return null;
        }
    }

    app.post("/api/data", async (req, res) => {
        try {
            const user = await getOrCreateDummyUser();
            if (!user) throw new Error("Kein User verfügbar");

            const { subjects, weeks, scores, selectedProgramId, selectedSemesterId } = req.body;

            await prisma.$transaction(async (tx) => {
                // 1. Einstellungen updaten
                await tx.user.update({
                    where: { id: user.id },
                    data: { selectedProgramId, selectedSemesterId }
                });

                // 2. Bestehende Daten löschen (für den aktuellen User)
                await tx.subject.deleteMany({ where: { userId: user.id } });
                await tx.week.deleteMany({ where: { userId: user.id } });

                // 3. Wochen neu anlegen
                if (weeks?.length) {
                    await tx.week.createMany({
                        data: weeks.map((w: any) => ({
                            id: w.id,
                            name: w.name,
                            date: w.date,
                            semesterId: w.semesterId,
                            userId: user.id
                        }))
                    });
                }

                // 4. Fächer & Deadlines & Scores
                for (const sub of subjects || []) {
                    const createdSubject = await tx.subject.create({
                        data: {
                            id: sub.id,
                            name: sub.name,
                            threshold: sub.threshold,
                            semesterId: sub.semesterId,
                            submissionUrl: sub.submissionUrl,
                            userId: user.id
                        }
                    });

                    // Deadlines für dieses Fach
                    if (sub.deadlines?.length) {
                        await tx.deadline.createMany({
                            data: sub.deadlines.map((d: any) => ({
                                id: d.id,
                                title: d.title,
                                date: d.date,
                                completed: !!d.completed,
                                subjectId: createdSubject.id
                            }))
                        });
                    }
                }

                // 5. Scores (Punkte)
                const scoreEntries = Object.entries(scores || {});
                const scoreData = [];

                for (const [key, value] of scoreEntries) {
                    if (value === "" || value === undefined) continue;
                    const [weekId, subjectId, type] = key.split("_");

                    // Sicherstellen, dass die IDs existieren
                    const subExists = subjects.some((s: any) => s.id === subjectId);
                    const weekExists = weeks.some((w: any) => w.id === weekId);

                    if (subExists && weekExists) {
                        scoreData.push({
                            weekId,
                            subjectId,
                            type,
                            value: String(value)
                        });
                    }
                }

                if (scoreData.length) {
                    // Da SQLite kein createMany mit Uniques mag, machen wir es einzeln oder prüfen vorher
                    for (const s of scoreData) {
                        await tx.score.create({ data: s });
                    }
                }
            });

            res.json({ success: true });
        } catch (error) {
            console.error("Speicherfehler:", error);
            res.status(500).json({ error: "DB Error" });
        }
    });

    // ==========================================
    // API ROUTEN (Jetzt mit lokaler Datenbank)
    // ==========================================

    app.get("/api/data", async (req, res) => {
        try {
            const user = await getOrCreateDummyUser();

            // Lade alle Daten des Users aus der Datenbank, inklusive Relationen
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    subjects: { include: { deadlines: true } },
                    weeks: true,
                }
            });

            const allScores = await prisma.score.findMany({
                where: { subject: { userId: user.id } }
            });

            // Baue das Score-Objekt wieder so zusammen, wie das Frontend es erwartet
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
            console.error("Fehler beim Laden aus der DB:", error);
            res.status(500).json({ error: "Datenbank-Fehler beim Laden" });
        }
    });

    app.post("/api/data", async (req, res) => {
        try {
            const { subjects, weeks, scores, selectedProgramId, selectedSemesterId } = req.body;
            const user = await getOrCreateDummyUser();

            // Prisma Transaktion: Entweder wird alles gespeichert oder gar nichts (verhindert Datenmüll)
            await prisma.$transaction(async (tx) => {

                // 1. User-Einstellungen updaten
                await tx.user.update({
                    where: { id: user.id },
                    data: { selectedProgramId, selectedSemesterId }
                });

                // 2. Alte Daten löschen.
                // (Da das Frontend aktuell alles auf einmal schickt, ist ein "Clear & Recreate"
                // hier der einfachste Weg. 'Cascade' löscht automatisch auch Deadlines und Scores mit!)
                await tx.subject.deleteMany({ where: { userId: user.id } });
                await tx.week.deleteMany({ where: { userId: user.id } });

                // 3. Wochen neu anlegen
                if (weeks && weeks.length > 0) {
                    await tx.week.createMany({
                        data: weeks.map((w: any) => ({
                            id: w.id,
                            name: w.name,
                            date: w.date,
                            semesterId: w.semesterId,
                            userId: user.id
                        }))
                    });
                }

                // 4. Fächer & Deadlines neu anlegen
                for (const subject of subjects || []) {
                    await tx.subject.create({
                        data: {
                            id: subject.id,
                            name: subject.name,
                            threshold: subject.threshold,
                            semesterId: subject.semesterId,
                            submissionUrl: subject.submissionUrl,
                            userId: user.id,
                            deadlines: {
                                create: subject.deadlines?.map((d: any) => ({
                                    id: d.id,
                                    title: d.title,
                                    date: d.date,
                                    completed: d.completed
                                })) || []
                            }
                        }
                    });
                }

                // 5. Scores wiederherstellen
                const scoreEntries = Object.entries(scores || {});
                for (const [key, value] of scoreEntries) {
                    if (!value) continue; // Keine leeren Strings in der DB speichern

                    const [weekId, subjectId, type] = key.split("_");

                    // Nur speichern, wenn Fach und Woche existieren
                    const subjectExists = subjects.some((s: any) => s.id === subjectId);
                    const weekExists = weeks.some((w: any) => w.id === weekId);

                    if (subjectExists && weekExists) {
                        await tx.score.create({
                            data: {
                                weekId,
                                subjectId,
                                type,
                                value: String(value)
                            }
                        });
                    }
                }
            });

            res.json({ success: true });
        } catch (error) {
            console.error("Fehler beim Speichern in der DB:", error);
            res.status(500).json({ error: "Datenbank-Fehler beim Speichern" });
        }
    });

    // ==========================================
    // FRONTEND (Vite & Static Files)
    // ==========================================
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
    });
}

startServer();