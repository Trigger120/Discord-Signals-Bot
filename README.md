# ⚡ TRIGGERXBT Signal Hub

TRIGGERXBT Signal Hub is a professional, high-performance web dashboard designed to broadcast trading signals to multiple Discord channels simultaneously via webhooks, maintain a local trade journal, and visualize trading analytics.

Developed using a premium dark cyberpunk aesthetic, the hub is structured for fast drafting, seamless cross-device synchronization, and secure offline-first performance.

---

## ✨ Features

*   **Freestyle Signal Composer**: Draft and edit your signal messages in a clean editor. Includes pre-filled formatting helpers for pairs, directions, and risk size.
*   **Multi-Server Broadcast**: Send signals to multiple Discord webhooks simultaneously with custom role pings.
*   **Discord Rich Embeds**: Deliver signals as beautifully structured Discord embeds with visual green/red color coding, inline levels fields, and screenshot attachments.
*   **Chart Screenshots**: Upload and attach chart analysis screenshots directly to your Discord signals.
*   **Performance Analytics**: Automated calculation of Win Rate, Total Risk-to-Reward (RR), Average RR, and graphical performance breakdown using Chart.js.
*   **Trade Journal**: Log and track positions. Includes filters by month, trades outcome statuses, and manual trade logging.
*   **Cross-Device Synchronization**: Instantly synchronize configurations and trade logs between your PC, laptop, and phone using a private Sync ID (powered by **kvdb.io**).
*   **Data Backups**: Securely export your configurations and logs as a JSON file and restore them anytime.

---

## 🚀 Getting Started

### 1. Web Deployment (GitHub Pages)
Since the application is built as a static client-side web application, you can host it for free using GitHub Pages:
1. In your GitHub repository, navigate to **Settings** > **Pages**.
2. Under **Build and deployment**, set the source to **Deploy from a branch**.
3. Select the `main` branch and `/ (root)` folder, then click **Save**.
4. GitHub will deploy your site. Your permanent URL will be:  
   `https://<your-username>.github.io/triggerxbt-signals/`

### 2. Local Execution
Since Puter.js requires a secure web context for authentication and cloud syncing, running the page directly by double-clicking `index.html` (which uses the `file://` protocol) is blocked.

To run the application locally from the source files, serve it using a simple development web server:
1. Open terminal/command prompt in the project folder.
2. Run a simple server using `npx`:
   ```bash
   npx http-server
   ```
3. Open the provided address (usually `http://localhost:8080`) in your web browser.

---

## 📱 Cross-Device Synchronization

To link your phone, laptop, or other devices:
1. Open the app on your primary device (e.g., PC).
2. Click the **Sync** button in the header.
3. Copy your unique **Sync ID** (e.g., `txbt_xxxxxxxxxxxxxxxxxxxxxxxx`).
4. Open the app on your second device (e.g., Phone), open the **Sync** modal, paste the copied ID, and click **Connect**.
5. Your devices are now connected. Any changes to webhooks, templates, or trade journals will sync instantly.

---

## 🔒 Security
*   **Authentication**: The app is locked behind an access PIN (default password is `trigger2024`), which you can change in the login cover.
*   **Privacy**: All cloud sync operations are encrypted and transmitted anonymously using your unique, unguessable Sync ID as a private namespace. No personal data is collected.
