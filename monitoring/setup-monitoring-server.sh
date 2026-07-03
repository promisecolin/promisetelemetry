#!/bin/bash
set -euo pipefail

# EC2 Monitoring Server Setup Script
# Run this on a fresh Ubuntu 24.04 t2.micro/t3.micro EC2 instance
#
# Usage:
#   1. SSH into your EC2 instance
#   2. Upload the monitoring/ directory
#   3. Run: chmod +x setup-monitoring-server.sh && ./setup-monitoring-server.sh

echo "==> Updating system..."
sudo apt update && sudo apt upgrade -y

echo "==> Installing Docker..."
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER"

echo "==> Creating .env file for monitoring stack..."
if [ ! -f .env ]; then
    cat > .env <<'ENVEOF'
# Fill in your AWS credentials for CloudWatch and X-Ray integration
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Change this from the default
GRAFANA_ADMIN_PASSWORD=admin
ENVEOF
    echo "    Created .env — edit it with your AWS credentials before starting the stack."
else
    echo "    .env already exists, skipping."
fi

echo ""
echo "==> Setup complete."
echo ""
echo "Next steps:"
echo "  1. Edit .env with your AWS credentials:"
echo "     nano .env"
echo ""
echo "  2. Start the monitoring stack:"
echo "     docker compose -f docker-compose.monitoring.yml up -d"
echo ""
echo "  3. Access Grafana:"
echo "     http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP'):3000"
echo ""
echo "  4. Access Prometheus:"
echo "     http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP'):9090"
echo ""
echo "  NOTE: Log out and back in for Docker group permissions to take effect."
