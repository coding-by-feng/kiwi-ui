---
name: deploy-pi-service
description: Deploy or restart a Node.js service on Raspberry Pi (kason-pi.local) as a systemd service with auto-restart on reboot. Use when deploying services to the Pi, restarting Pi services, or checking Pi service status.
user_invocable: true
---

# Deploy Pi Service

Deploy, restart, or check status of Node.js systemd services on the Raspberry Pi production server.

## Connection Details

- Host: `kason-pi.local`
- User: `kason`
- Auth: `sshpass -p '135246Zsf' ssh kason@kason-pi.local`
- Node: `/usr/bin/node`
- Working dir: `/home/kason/kiwi-ui`

## Existing Services

| Service | Script | Port | Description |
|---------|--------|------|-------------|
| ytb-transcript | scripts/ytb-transcript-server.js | 3721 | YouTube subtitle fetching via youtube-transcript |

## Commands

### Check service status
```bash
sshpass -p '135246Zsf' ssh kason@kason-pi.local "sudo systemctl status <service-name>"
```

### Restart a service
```bash
sshpass -p '135246Zsf' ssh kason@kason-pi.local "sudo systemctl restart <service-name> && sleep 1 && sudo systemctl status <service-name>"
```

### View logs
```bash
sshpass -p '135246Zsf' ssh kason@kason-pi.local "sudo journalctl -u <service-name> -n 50 --no-pager"
```

### Deploy a NEW Node.js service

1. **Copy script to Pi** (if not already deployed via git):
```bash
sshpass -p '135246Zsf' scp <local-script-path> kason@kason-pi.local:/home/kason/kiwi-ui/scripts/
```

2. **Install dependencies** (if needed):
```bash
sshpass -p '135246Zsf' ssh kason@kason-pi.local "cd /home/kason/kiwi-ui && npm install <package-name>"
```

3. **Create systemd service file**:
```bash
sshpass -p '135246Zsf' ssh kason@kason-pi.local "cat << 'EOF' | sudo tee /etc/systemd/system/<service-name>.service
[Unit]
Description=<Service Description>
After=network.target

[Service]
Type=simple
User=kason
WorkingDirectory=/home/kason/kiwi-ui
ExecStart=/usr/bin/node scripts/<script-name>.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF"
```

4. **Enable and start**:
```bash
sshpass -p '135246Zsf' ssh kason@kason-pi.local "sudo systemctl daemon-reload && sudo systemctl enable <service-name> && sudo systemctl start <service-name> && sleep 2 && sudo systemctl status <service-name>"
```

5. **Add nginx proxy** (in `nginx.conf` on Pi):
```nginx
location /<endpoint> {
    proxy_pass http://127.0.0.1:<port>;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

6. **Reload nginx**:
```bash
sshpass -p '135246Zsf' ssh kason@kason-pi.local "sudo nginx -t && sudo systemctl reload nginx"
```

## Usage

Invoke with: `/deploy-pi-service`

Arguments:
- No args: show status of all Pi services
- `restart <service>`: restart a specific service
- `logs <service>`: view recent logs
- `deploy`: guided new service deployment

## Instructions for Claude

When this skill is invoked:

1. If **no arguments** or `status`: check status of all known services (ytb-transcript, etc.)
2. If `restart <name>`: restart that systemd service and show status
3. If `logs <name>`: show last 50 journal lines
4. If `deploy`: ask for script path, service name, port, and description, then run the full deployment steps above
5. Always verify the service is running after any change
6. Update the "Existing Services" table in this skill file when adding new services
