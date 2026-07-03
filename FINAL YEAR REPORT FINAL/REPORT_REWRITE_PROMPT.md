# Prompt for Rewriting the Final Year Project Report

Copy and paste this entire prompt into a new conversation to have the report rewritten from scratch.

---

## PROMPT START

I have a final year academic project report in .docx format that needs to be completely rewritten. The report is for a BTECH CSE student project titled "Cloud-Native Observability and Automated Alerting System for E-Commerce Performance Monitoring."

### THE PROBLEM

The existing report was originally written around **Google Cloud** services (Google Cloud Run, Firebase Authentication, Firebase Firestore, Artifact Registry, Cloud Build) and used the system name **"MBOAFLOW"**. It also referenced technologies we never actually used: Grafana Loki, Grafana Tempo, Alertmanager, Kubernetes, Helm, and ArgoCD.

However, the actual project was built and deployed entirely on **Amazon Web Services (AWS)** with the system name **"PromiseTelemetry"**. The report must be updated to reflect the real implementation.

### WHAT MUST BE CHANGED

1. **Remove ALL Google Cloud references** — Google Cloud Run, Firebase Auth, Firebase Firestore, Cloud Build, Artifact Registry, Google Cloud Console, Google AI Studio must all be removed and replaced with their AWS equivalents.

2. **Remove ALL technologies not actually used** — Grafana Loki, Grafana Tempo, Alertmanager, Kubernetes, Helm, ArgoCD, Fluent Bit, Fluentd must all be removed.

3. **Rename the system** — Every reference to "MBOAFLOW" or "MboaFlow" must be replaced with "PromiseTelemetry."

4. **Replace with the actual AWS stack used:**
   - Amazon ECS Fargate (container orchestration, replacing Kubernetes)
   - Amazon ECR (container registry, replacing Artifact Registry)
   - Application Load Balancer (permanent DNS endpoint)
   - Amazon EC2 t3.micro (monitoring server hosting Docker containers)
   - AWS CloudWatch Logs (log aggregation, replacing Loki)
   - AWS X-Ray (distributed tracing, replacing Tempo)
   - Amazon SNS + CloudWatch Alarms (alerting, replacing Alertmanager)
   - AWS IAM (access control)
   - Elastic IP (permanent monitoring server address)
   - Prometheus (metrics storage — this was actually used, keep it)
   - Grafana (visualization — this was actually used, keep it)
   - OpenTelemetry SDK + Collector (instrumentation — this was actually used, keep it)
   - Docker + Docker Compose (containerisation — keep it)
   - Gemini API for AI diagnostics (keep it)

5. **Remove Firebase entirely** — The actual app has no authentication system, no Firestore database. It uses in-memory simulated telemetry data. Describe the system as it actually is.

### EDITING RULES

- **DO NOT touch anything before Chapter 1** — The Certification, Dedication, Acknowledgements, and Preface pages contain school/institutional information that must remain exactly as they are.
- **You ARE allowed to update** the Abstract, Resume, Table of Contents, List of Figures, List of Tables, and Table of Abbreviations since the chapter content is changing.
- **Edit starts from Chapter 1** (Literature Review) through Chapter 3 (Implementation & Results) and References.
- **Keep the same report format and structure** — Same chapter numbering, same section organization, same table/figure numbering convention. Only update the content within the existing structure.
- **The existing formatted .docx is the base** — Work from the existing Word document's format. The school has a specific formatting standard that must be preserved.

### THE ACTUAL PROJECT — WHAT TO DESCRIBE

**PromiseTelemetry** is a React + Express/TypeScript full-stack application that:

- Simulates 17 e-commerce microservices (frontend, paymentservice, checkoutservice, cartservice, productcatalogservice, searchservice, postgres, redis, shippingservice, currencyservice, recommendationservice, emailservice, adservice, inventoryservice, userservice, notificationservice, analyticsservice)
- Generates realistic telemetry every 2 seconds: per-service metrics, distributed traces across 3 transaction flows, structured logs with severity levels
- Simulates periodic incidents: payment latency spikes, database timeouts, high CPU events
- Has 14 custom OpenTelemetry metrics (http_request_duration, service_latency, business_orders, business_revenue, platform_cpu, etc.)
- Includes AI-powered diagnostics via Gemini API with rule-based fallback
- Streams data to the frontend via Server-Sent Events (SSE)

**AWS Deployment:**
- Docker image (158MB, multi-stage build) pushed to ECR
- Running on ECS Fargate (0.5 vCPU, 1GB RAM) behind an ALB
- EC2 t3.micro hosts: OTel Collector, Prometheus, Grafana, Node Exporter via Docker Compose
- OTel Collector receives OTLP data and routes: metrics → Prometheus, traces → X-Ray, logs → CloudWatch
- Grafana has 2 auto-provisioned dashboards (50 total panels): pt-master (Command Center) and pt-tal (Tracing, Alerts, Logs + Services)
- 6 CloudWatch Log Groups with 7-30 day retention
- 5 CloudWatch Alarms with SNS email notifications
- Elastic IP for permanent monitoring server access
- All running within AWS free-tier limits

**Live Endpoints:**
- App: http://promisetelemetry-alb-687682726.us-east-1.elb.amazonaws.com
- Grafana: http://44.195.208.73:3000
- Prometheus: http://44.195.208.73:9090

### REPORT STRUCTURE TO FOLLOW

**General Introduction** — Context, Problem Statement, Objectives, Work Plan

**Chapter 1: Literature Review** — Observability pillars (metrics, logs, traces), existing solutions (Datadog, Dynatrace, ELK), pros, challenges, partial conclusion

**Chapter 2: Methodologies & Materials** — Stakeholder analysis, 9 functional requirements (FR-01 to FR-09), non-functional requirements, system architecture, UML diagrams (use case, sequence, activity, class, deployment, data flow), technology stack table, risk assessment, implementation sections (OTel SDK, OTel Collector, Prometheus, CloudWatch Logs, X-Ray, CloudWatch Alarms + SNS), deployment strategy, interface descriptions, partial conclusion

**Chapter 3: Implementation & Results** — Core technologies (frontend, backend, cloud, AI), libraries, tools, system implementation architecture, frontend implementation (11 React components), backend implementation (Express APIs), data management (in-memory simulation), AWS cloud deployment (ECR, ECS, ALB, EC2 monitoring stack, Grafana dashboards, CloudWatch log groups, SNS alerts, IAM/security), AWS services matrix, results obtained, testing (functional, integration, deployment), conclusion with achieved objectives and future improvements

**References** — Include AWS documentation references [9]-[14] alongside the existing academic references

### OUTPUT

Generate the complete rewritten report text for all chapters. The text should be ready to paste into the existing Word document, replacing everything from the Abstract through the References while keeping all formatting placeholders for figures (e.g., "Figure 6: System Architecture") so I can re-insert the diagrams manually.

## PROMPT END
