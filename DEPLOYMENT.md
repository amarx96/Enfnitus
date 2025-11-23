# Deployment-Guide für Enfinitus & Viet Energie

Diese Anleitung beschreibt die empfohlene Hosting-Architektur mit **Production** (Live) und **Test** (Staging/Preview) Umgebungen.

## Übersicht der Architektur

Wir nutzen eine moderne "Serverless/PaaS" Strategie, die wenig Wartung erfordert und automatisch skaliert.

| Komponente | Technologie | Hosting-Empfehlung | Warum? |
|------------|-------------|--------------------|--------|
| **Datenbank** | PostgreSQL | **Supabase** | Bereits genutzt, Cloud-Native, einfaches Backup/Restore. |
| **Backend** | Node.js / Express | **Railway** (oder Render) | Einfachstes Deployment für Node.js, unterstützt Monorepos, günstige Preise. |
| **Frontend** | React (Vite/CRA) | **Vercel** | Beste Performance für React, "Preview Deployments" für jeden Pull Request automatisch. |

---

## 1. Datenbank (Supabase)

Für eine saubere Trennung sollten Sie **zwei** Projekte in Supabase anlegen:

1.  **PROD Project**: Die Live-Datenbank.
2.  **TEST Project**: Für Entwicklung und Tests.

**Schritte:**
1.  Gehen Sie zu [supabase.com](https://supabase.com) und erstellen Sie die Projekte.
2.  Kopieren Sie die Credentials (`DB_HOST`, `DB_PASSWORD`, etc.) für beide Projekte.
3.  Führen Sie die SQL-Migrationsskripte (`CONTRACTING_SERVICE_SCHEMA.sql`, etc.) im SQL-Editor beider Projekte aus, um die Tabellenstruktur anzulegen.

---

## 2. Backend Hosting (Railway)

Railway ist ideal, da es GitHub-Repos überwacht und bei jedem Push automatisch deployt.

**Einrichtung:**
1.  Account bei [railway.app](https://railway.app) erstellen (Login mit GitHub).
2.  "New Project" -> "Deploy from GitHub repo" -> Dieses Repository auswählen.
3.  **Konfiguration**:
    *   Root Directory: `./` (Standard)
    *   Start Command: `npm start` (oder `node src/server.js`)
4.  **Umgebungsvariablen (Variables)**:
    *   Hier tragen Sie die Supabase-Daten ein:
        *   `DB_ENABLED`: `true`
        *   `DATABASE_URL`: `postgres://postgres:[PASSWORD]@[HOST]:5432/postgres` (Connection String von Supabase)
        *   `PORT`: `8080` (Railway setzt dies oft automatisch, aber gut zu definieren)

**Test vs. Prod auf Railway:**
*   Erstellen Sie in Railway ein zweites "Environment" (z.B. "Staging").
*   Verbinden Sie dieses Environment mit dem `develop` Branch auf GitHub.
*   Hinterlegen Sie dort die `DATABASE_URL` des **TEST Supabase Projekts**.
*   Ergebnis: Push auf `main` -> Deployt Prod Backend. Push auf `develop` -> Deployt Test Backend.

---

## 3. Frontend Hosting (Vercel)

Vercel bietet die beste Erfahrung für React Frontends. Sie erstellen **zwei** Projekte in Vercel, die beide auf dasselbe GitHub-Repo zeigen, aber unterschiedliche Unterordner nutzen.

### Projekt A: Enfinitus Frontend
1.  Account bei [vercel.com](https://vercel.com).
2.  "Add New Project" -> GitHub Repo auswählen.
3.  **Root Directory**: Bearbeiten und auf `frontend-chakra` setzen.
4.  **Framework Preset**: Create React App (wird meist automatisch erkannt).
5.  **Environment Variables**:
    *   `REACT_APP_API_URL`: Die URL Ihres Railway Backends (z.B. `https://backend-production.railway.app` für Prod).
6.  Deployen.

### Projekt B: Viet Energie Frontend
1.  Neues Projekt in Vercel erstellen -> Gleiches Repo auswählen.
2.  **Root Directory**: Bearbeiten und auf `frontend-viet` setzen.
3.  **Environment Variables**:
    *   `REACT_APP_API_URL`: Gleiche Backend-URL wie oben.
4.  Deployen.

**Vercel Preview Deployments (Test-Umgebung):**
*   Vercel erstellt automatisch für jeden **Pull Request** auf GitHub eine temporäre "Preview URL".
*   Damit haben Sie automatisch eine Test-Umgebung für jede Änderung am Frontend.
*   **Tipp**: Sie können konfigurieren, dass Preview-Deployments gegen das Staging-Backend (Railway Test Environment) laufen, indem Sie Umgebungsvariablen für "Preview" separat setzen.

---

## 4. CI/CD (GitHub Actions)

Eine GitHub Actions Pipeline wurde bereits unter `.github/workflows/ci.yml` angelegt.

**Was sie tut:**
*   Bei jedem Push auf `main` oder `develop`:
    *   Installiert Backend-Dependencies und führt Unit-Tests aus (`npm test`).
    *   Prüft, ob sich beide Frontends bauen lassen (Build Check), um Fehler frühzeitig zu finden.

Wenn diese Tests fehlschlagen, wird GitHub das Deployment (auf Railway/Vercel) zwar nicht automatisch stoppen (außer Sie konfigurieren "Protect Branch" Regeln in GitHub), aber Sie sehen sofort rote Kreuze im Repo.

### Empfohlener Workflow (Versioning)
1.  Entwickeln Sie Features in separaten Branches (z.B. `feature/pricing-update`).
2.  Erstellen Sie einen **Pull Request** zu `develop` (oder `main`).
3.  GitHub Actions führt Tests aus. Vercel erstellt eine Preview-Version des Frontends.
4.  Nach Tests/Review: Merge in `main`.
5.  Railway deployt automatisch das neue Backend nach Prod. Vercel aktualisiert die Live-Webseite.

