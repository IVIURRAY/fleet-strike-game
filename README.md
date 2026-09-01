# Fleet Strike

A server-authoritative 1v1 naval auto-battler built with PixiJS 8, TypeScript, Node.js, WebSockets, and bitECS.

**Tech Stack:**
- **Frontend:** TypeScript, PixiJS 8 (2D WebGPU/WebGL), bitECS
- **Backend:** Node.js, Express, WebSocket
- **Infrastructure:** Docker, Digital Ocean, Terraform
- **CI/CD:** GitHub Actions

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`, create a room, then join its code from a second browser window.

## Controls

Choose Vanguard, Mid line, or Rear guard, then click a ship card to queue that vessel. Gold accrues continuously and queued ships launch automatically every 30 seconds.
