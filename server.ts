import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Lade Umgebungsvariablen aus der .env Datei (z.B. später für DB-Passwörter)
dotenv.config();

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(process.cwd(), "data.json");

async function startServer() {
    const app = express();
    app.use(express.json({ limit: '10mb' }));

    // ==========================================
    // 1. DATENBANK & AUTH (Vorbereitung)
    // ==========================================
    // Hier kommt später deine DB-Verbindung hin (z.B. mit Mongoose, Prisma, pg)
    // und deine Middleware für Session-Handling/Passwort-Überprüfung.

    // Fallback für den Übergang: Stelle sicher, dass data.json existiert
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify({}));
    }

    // ==========================================
    // 2. API ROUTEN
    // ==========================================
    // Später kannst du hier eine Middleware wie "requireAuth" einbauen,
    // damit nur eingeloggte User ihre Daten sehen können.

    app.get("/api/data", async (req, res) => {
        try {
            // Zukünftig: const data = await db.user.getData(req.user.id);
            const data = await fs.readFile(DATA_FILE, "utf-8");
            res.json(JSON.parse(data));
        } catch (error) {
            res.status(500).json({ error: "Failed to read data" });
        }
    });

    app.post("/api/data", async (req, res) => {
        try {
            // Zukünftig: await db.user.saveData(req.user.id, req.body);
            await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: "Failed to save data" });
        }
    });

    // ==========================================
    // 3. FRONTEND (Vite & Static Files)
    // ==========================================
    if (process.env.NODE_ENV !== "production") {
        // Entwicklungsmodus: Vite übernimmt das Ausliefern und Hot-Reloading
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        // Produktionsmodus: Das gebaute Frontend aus dem /dist Ordner ausliefern
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