# PromiseTelemetry

A cloud-native e-commerce observability platform with real-time telemetry simulation, AI-powered diagnostics, and full AWS deployment.

## Live Endpoints

| Service | URL |
|---------|-----|
| **App** | http://promisetelemetry-alb-687682726.us-east-1.elb.amazonaws.com |
| **Grafana** | http://44.195.208.73:3000 |
| **Prometheus** | http://44.195.208.73:9090 |

## Run Locally

**Prerequisites:** Node.js 20+, Docker

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and set your `GEMINI_API_KEY` (optional — app falls back to rule-based diagnostics)
3. Run the app:
   ```
   npm run dev
   ```
4. Open http://localhost:3000

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
