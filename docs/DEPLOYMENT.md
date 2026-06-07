# Deployment Guide

This guide describes how to deploy KraftKurve using Docker Compose or systemd. This setup is suitable for home servers (e.g., Proxmox LXC), testing, and production environments.

## Prerequisites
- Docker and Docker Compose (for Docker deployment)
- Node.js >= 22 and pnpm (for systemd deployment)
- A Reverse Proxy (Nginx Proxy Manager, Traefik, Caddy) for SSL/HTTPS.

---

## Quick Start (Interactive Setup)

The easiest way to get started is by using the interactive setup script. It will guide you through setting your admin credentials and choosing a deployment method.

```bash
chmod +x setup.sh
./setup.sh
```

---

## HTTPS / SSL Setup (Recommended)

Since KraftKurve is a PWA (Progressive Web App), it **requires HTTPS** to enable service workers (Offline-Mode) and to be installable on mobile devices.

### 1. Nginx Proxy Manager (Empfohlen)
Nginx Proxy Manager (NPM) fungiert als zentraler SSL-Endpunkt. Du musst **kein SSL** in den KraftKurve-Containern oder im Code selbst konfigurieren.

*   **Docker**: In NPM erstellst du einen Proxy Host.
    *   Forward Host: `kraftkurve-web` (wenn NPM im selben Docker-Netzwerk ist) oder die IP deines Servers.
    *   Forward Port: `8080`.
*   **systemd**: Auch hier kannst du NPM nutzen!
    *   Forward Host: Die lokale IP deines Linux-Hosts (z.B. `192.168.1.10`).
    *   Forward Port: Der Port, den du für die API/Frontend-Kombination in Nginx vergeben hast.

NPM übernimmt das "SSL Offloading", d.h. zwischen NPM und KraftKurve wird HTTP gesprochen, nach außen hin ist alles sicher verschlüsselt.

### 2. Alternative: systemd Environment (Certbot)
If you run KraftKurve directly on Linux:

1.  Install Certbot: `sudo apt install certbot python3-certbot-nginx`
2.  Run Certbot for your domain: `sudo certbot --nginx -d gym.yourdomain.com`
3.  Certbot will automatically update your Nginx configuration to support SSL.

---

## Standard Deployment (Docker Compose)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/KraftKurve.git
    cd KraftKurve
    ```

2.  **Run the setup script**:
    ```bash
    ./setup.sh
    ```
    Choose option `1` for Docker Compose.

3.  **Manual Start** (If you don't use the script):
    Create a `.env` file with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `PORT`.
    Then run:
    ```bash
    docker compose up -d --build
    ```
    The application will be available at `http://<your-server-ip>:8080`.

## Proxmox LXC Specifics

If you are running KraftKurve inside a **Proxmox LXC Container**, follow these steps for a smooth experience:

1.  **Container Configuration**:
    - Use a Debian or Ubuntu template.
    - **Crucial**: In the LXC "Options" tab, enable **Nesting** and **keyctl**. This is required for Docker to run correctly inside LXC.
2.  **Storage**:
    - Ensure you have enough disk space (the build process uses several GBs for temporary layers).
3.  **Docker Installation**:
    Follow the official Docker installation guide for your Linux distribution inside the LXC.

---

## Alternative: systemd Deployment (Linux Host)

If you prefer to run the application directly on your Linux host without Docker:

1.  **Run the setup script** and choose option `2`:
    ```bash
    ./setup.sh
    ```
2.  **Install Nginx** to serve the frontend:
    ```bash
    sudo apt update && sudo apt install nginx
    ```
3.  **Configure Nginx**:
    Create a site config that points to `apps/web/dist/kraftkurve-mobile-app/browser` and proxies `/api` to `localhost:3000`.
4.  **Register the service**:
    ```bash
    sudo cp kraftkurve-api.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable --now kraftkurve-api
    ```

---

## Micro-Frontend (MFE) Architecture

Currently, the default deployment uses the **monolithic Mobile App** for simplicity and performance on low-resource hardware.

---

## Data Persistence
The API stores all data in NDJSON files. These are persisted in the `./data` directory on your host machine via a Docker volume or local directory. **Back up this directory regularly.**

## Updating
To update to the latest version:
```bash
git pull
# If using Docker:
docker compose up -d --build
# If using systemd:
pnpm install && pnpm run build:api && pnpm run build:mobile
sudo systemctl restart kraftkurve-api
```
