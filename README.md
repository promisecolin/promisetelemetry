# PromiseTelemetry

A cloud-native e-commerce observability platform with real-time telemetry simulation, AI-powered diagnostics, and full AWS deployment.

## Live Endpoints

**Currently offline.** The AWS account these were deployed under has been suspended; the app and monitoring stack below are run locally in Docker until a new AWS account is set up and redeployment happens. See [DEPLOYMENT.md](DEPLOYMENT.md) for the old resource IDs (kept as a runbook for the redeploy).

| Service | URL (when deployed) |
|---------|-----|
| **App** | http://promisetelemetry-alb-687682726.us-east-1.elb.amazonaws.com |
| **Grafana** | http://44.195.208.73:3000 |
| **Prometheus** | http://44.195.208.73:9090 |

## Run Locally

**Prerequisites:** Node.js 20+, Docker

### Option A — app only, no Docker

```
npm install
```
Copy `.env.example` to `.env` and set your `GEMINI_API_KEY` (optional — app falls back to rule-based diagnostics), then:
```
npm run dev
```
Open http://localhost:3000

### Option B — app in Docker (dev, hot-reload)

```
docker compose up -d
```
Open http://localhost:3000

### Option C — full stack in Docker: app + monitoring (Prometheus/Grafana/OTel Collector)

Runs everything on one machine, including the observability stack. Three extra files make this work locally (gitignored, not part of the repo since they're machine-specific — see comments in each file for why):

- `monitoring/.env` — placeholder AWS creds (X-Ray/CloudWatch exporters need AWS and won't work without it) + a local Grafana admin password
- `monitoring/docker-compose.local-override.yml` — moves Grafana off port 3000 so it doesn't clash with the app
- `docker-compose.local.yml` — attaches the app container to the monitoring network and points its OTel exporter at `otel-collector` instead of `localhost`

Create `monitoring/.env` from `monitoring/.env.example` (any placeholder values work for AWS creds locally), then:

```bash
# 1. start the monitoring stack first (creates the shared network)
docker compose -p monitoring -f monitoring/docker-compose.monitoring.yml -f monitoring/docker-compose.local-override.yml --env-file monitoring/.env up -d

# 2. start the app, attached to that network
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| Grafana | http://localhost:3001 (admin / value of `GRAFANA_ADMIN_PASSWORD` in `monitoring/.env`) |
| Prometheus | http://localhost:9090 |

Metrics flow end-to-end (app → OTel Collector → Prometheus → Grafana). Traces/logs panels relying on X-Ray/CloudWatch will show no data locally since those need real AWS.

To stop everything:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down
docker compose -p monitoring -f monitoring/docker-compose.monitoring.yml -f monitoring/docker-compose.local-override.yml down
```

## Architecture

```
PromiseTelemetry App (ECS Fargate, behind ALB)
    |
    | OTLP HTTP (:4318)
    v
OTel Collector (EC2 Docker)
    |
    +---> Prometheus (:9090) ---> Grafana (:3000)
    +---> AWS X-Ray (traces)
    +---> CloudWatch Logs
```

## AWS Deployment

Full deployment details including all resource IDs, ARNs, security groups, and credentials are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

Quick deploy:
```bash
# Build and push to ECR
./deploy.sh ecr-setup
./deploy.sh push

# Or deploy everything at once
./deploy.sh all
```

## Monitoring Stack

The monitoring stack runs on an EC2 t3.micro instance via Docker Compose:

```bash
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

Containers: OTel Collector, Prometheus, Grafana, Node Exporter.

---

## Troubleshooting

### Grafana Dashboard Shows "No Data"

**Root Cause:** Datasource UID mismatch. The dashboard JSON references a Prometheus datasource by UID, but Grafana auto-generates a random UID when provisioning datasources for the first time. If the UID in the dashboard JSON does not match the UID Grafana assigned to Prometheus, every panel shows "No Data".

**How to diagnose:**

1. Get the actual datasource UID that Grafana assigned:
   ```
   curl -s -u admin:PASSWORD http://GRAFANA_IP:3000/api/datasources | grep -o '"uid":"[^"]*"'
   ```
   Look for the Prometheus entry. Example output:
   ```
   "uid":"PBFA97CFB590B2093"
   ```

2. Check what UID the dashboard JSON is using:
   ```
   grep -o '"uid":"[^"]*"' monitoring/grafana/provisioning/dashboards/json/promisetelemetry-master.json | head -5
   ```

3. If they don't match, that's the problem.

**How to fix:**

1. Replace every datasource UID reference in the dashboard JSON with the correct one:
   ```bash
   # Replace OLD_UID with the actual UID from step 1
   sed -i 's/"uid":"OLD_UID"/"uid":"CORRECT_UID"/g' monitoring/grafana/provisioning/dashboards/json/promisetelemetry-master.json
   ```

2. Upload the fixed file to the EC2 monitoring server:
   ```bash
   scp -i promisetelemetry-key.pem monitoring/grafana/provisioning/dashboards/json/promisetelemetry-master.json ubuntu@EC2_IP:/home/ubuntu/monitoring/grafana/provisioning/dashboards/json/
   ```

3. Restart Grafana:
   ```bash
   ssh -i promisetelemetry-key.pem ubuntu@EC2_IP "sudo docker restart grafana"
   ```

**How to prevent it:**

Pin the datasource UID in `monitoring/grafana/provisioning/datasources/datasources.yml` so Grafana always uses the same UID:

```yaml
datasources:
  - name: Prometheus
    uid: PBFA97CFB590B2093    # <-- pin this
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
```

Then use that same UID in all dashboard JSON files. This way, even if you destroy and recreate the Grafana container, the UIDs stay consistent.

**Current UIDs (as deployed):**

| Datasource | UID |
|------------|-----|
| Prometheus | `PBFA97CFB590B2093` |
| CloudWatch | `P034F075C744B399F` |
| X-Ray | `P6FE357156AE9A7FB` |
