# ⚡ TRIGGERXBT Signal Hub

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Discord%20API-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord API" />
  <img src="https://img.shields.io/badge/Database-Puter.js-00C853?style=for-the-badge" alt="Puter.js" />
</p>

TRIGGERXBT Signal Hub is a professional, high-performance web dashboard designed to broadcast trading signals to multiple Discord channels simultaneously via webhooks, maintain a local trade journal, and visualize trading analytics.

Developed using a premium dark cyberpunk aesthetic, the hub is structured for fast drafting, seamless cross-device synchronization, and secure offline-first performance.

---

## 🔒 Security & Data Privacy (No Webhook Leaks)

This application is built with a **100% serverless client-side architecture**. This guarantees absolute privacy for your configurations and logs:

* **Zero Hardcoded Secrets:** There are no Discord webhook URLs, role pings, or journal credentials stored in the source files. 
* **Safe Open-Source Use:** If someone forks this repository, they will see a completely fresh, blank workspace. They must enter their own credentials. **Your private webhooks and logs are completely invisible to others.**
* **Local-First Storage:** All data is saved in your browser's persistent `localStorage`.
* **Direct Edge Sync:** Synchronization is handled via **Puter.js** using direct edge database calls under your own secure Puter account. No server or proxy sits in between.

---

## 🏗️ System Architecture

The following diagram illustrates how data flows securely within the TRIGGERXBT Signal Hub. No user data, webhooks, or logs are ever transmitted to or stored on third-party servers. All operations happen directly inside the user's browser sandbox.

```mermaid
graph TD
    subgraph Client Browser [Client-Side App (User Sandbox)]
        UI[Freestyle Signal Composer & Trade Journal]
        Logic[JS App Controller (app.js, journal.js)]
        LocalDB[(Browser LocalStorage)]
    end

    subgraph Puter Edge Cloud [Puter.js Serverless Services]
        PuterAuth[Puter Secure Auth]
        PuterKV[(Puter Key-Value Store)]
    end

    subgraph External APIs [External Endpoints]
        DiscordAPI[Discord API Webhook Servers]
    end

    UI --> Logic
    Logic <--> LocalDB
    Logic <--> PuterAuth
    Logic <--> PuterKV
    Logic -- Broadcast Signals --> DiscordAPI

    style Client Browser fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc
    style Puter Edge Cloud fill:#022c22,stroke:#10b981,stroke-width:2px,color:#f8fafc
    style External APIs fill:#1e1b4b,stroke:#5865f2,stroke-width:2px,color:#f8fafc
    style UI fill:#1e293b,stroke:#f59e0b,stroke-width:1px,color:#f8fafc
    style Logic fill:#1e293b,stroke:#f59e0b,stroke-width:1px,color:#f8fafc
    style LocalDB fill:#1e293b,stroke:#64748b,stroke-width:1px,color:#f8fafc
```

---

## ✨ Features

* **Freestyle Signal Composer**: Draft and edit your signal messages in a clean, Space Mono code editor. Includes quick pre-filled preset pills for trading pairs, directions, and risk parameters.
* **Multi-Server Broadcast**: Send signals to multiple Discord webhooks simultaneously with customized channel pings.
* **Rich Discord Embeds**: Deliver signals as beautifully structured Discord embeds with color-coded layouts (green for LONG, red for SHORT) and inline trading parameter fields.
* **Chart Analysis Attachments**: Upload and attach trading chart screenshots directly to your broadcasted signals.
* **Trade Journal**: Complete trade logging system featuring filtering options by month, trade status outcomes (Win, Loss, Breakeven, Open), and manual entries.
* **Structured PDF Reports**: Export high-quality landscape performance journals complete with monthly KPIs, win/loss stats, net RR multiples, and account growth tables.
* **Cross-Device Sync**: Instantly link your phone, laptop, and PC by signing in with the same Puter account in the Sync Modal.

---

## 🚀 Installation & Setup

### 1. Web Deployment (GitHub Pages)
The easiest way to host your own instance of the hub for free is via GitHub Pages:
1. Fork this repository to your own GitHub account.
2. In your repository settings, navigate to **Settings** > **Pages**.
3. Under **Build and deployment**, set the source to **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder, then click **Save**.
5. GitHub will deploy your site in ~30 seconds. Your permanent URL will be:  
   `https://<your-username>.github.io/Discord-Signals-Bot/`

### 2. Local Execution
Puter.js requires a secure origin (http/https context) for database operations. Therefore, running the page by double-clicking `index.html` (which uses the local `file://` protocol) is blocked.

To run the application locally on your laptop:
1. Open your terminal or Command Prompt in the project directory.
2. Serve the static files using a simple web server:
   ```bash
   npx http-server
   ```
3. Open the local address in your web browser:
   `http://localhost:8080`

---

## ⚙️ Discord Webhook Configuration

To broadcast signals to your Discord servers:
1. In Discord, go to **Channel Settings** > **Integrations** > **Webhooks** and click **Create Webhook**.
2. Copy the Webhook URL.
3. Open the TRIGGERXBT Signal Hub, click **Servers** in the header, and paste the URL.
4. *(Optional)* To ping a specific role: in Discord, go to Server Settings > Roles, right-click the target role, and select **Copy Role ID**. Paste this ID in the Server setup to trigger automated pings.
