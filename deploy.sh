#!/bin/bash
set -euo pipefail

# PromiseTelemetry AWS Deployment Script
# Usage: ./deploy.sh <command>
# Commands: ecr-setup, push, ecs-deploy, logs-setup, all

AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO="promisetelemetry"
ECS_CLUSTER="promisetelemetry-cluster"
ECS_SERVICE="promisetelemetry-service"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

command="${1:-help}"

ecr_setup() {
    echo "==> Creating ECR repository..."
    aws ecr create-repository \
        --repository-name "${ECR_REPO}" \
        --region "${AWS_REGION}" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 \
        2>/dev/null || echo "Repository already exists."

    echo "==> ECR repository ready: ${ECR_URI}"
}

build_and_push() {
    echo "==> Authenticating Docker with ECR..."
    aws ecr get-login-password --region "${AWS_REGION}" | \
        docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

    echo "==> Building Docker image..."
    docker build -t "${ECR_REPO}:latest" .

    echo "==> Tagging image..."
    docker tag "${ECR_REPO}:latest" "${ECR_URI}:latest"

    echo "==> Pushing to ECR..."
    docker push "${ECR_URI}:latest"

    echo "==> Image pushed: ${ECR_URI}:latest"
}

ecs_deploy() {
    echo "==> Creating ECS cluster..."
    aws ecs create-cluster \
        --cluster-name "${ECS_CLUSTER}" \
        --region "${AWS_REGION}" \
        2>/dev/null || echo "Cluster already exists."

    echo "==> Updating task definition with account ID..."
    sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" aws/ecs-task-definition.json > /tmp/task-def-resolved.json

    echo "==> Registering ECS task definition..."
    aws ecs register-task-definition \
        --cli-input-json file:///tmp/task-def-resolved.json \
        --region "${AWS_REGION}"

    echo "==> Task definition registered."
    echo ""
    echo "Next steps:"
    echo "  1. Create a VPC with public subnets (or use default VPC)"
    echo "  2. Create the ECS service:"
    echo ""
    echo "     aws ecs create-service \\"
    echo "       --cluster ${ECS_CLUSTER} \\"
    echo "       --service-name ${ECS_SERVICE} \\"
    echo "       --task-definition promisetelemetry \\"
    echo "       --desired-count 1 \\"
    echo "       --launch-type FARGATE \\"
    echo "       --network-configuration \"awsvpcConfiguration={subnets=[SUBNET_ID],securityGroups=[SG_ID],assignPublicIp=ENABLED}\""
}

logs_setup() {
    echo "==> Creating CloudWatch log groups..."
    for group in /promisetelemetry/ecs /promisetelemetry/frontend /promisetelemetry/payment /promisetelemetry/orders /promisetelemetry/auth /promisetelemetry/otel; do
        aws logs create-log-group \
            --log-group-name "${group}" \
            --region "${AWS_REGION}" \
            2>/dev/null || echo "Log group ${group} already exists."
    done

    echo "==> Setting retention policies..."
    aws logs put-retention-policy --log-group-name /promisetelemetry/ecs --retention-in-days 14 --region "${AWS_REGION}"
    aws logs put-retention-policy --log-group-name /promisetelemetry/frontend --retention-in-days 14 --region "${AWS_REGION}"
    aws logs put-retention-policy --log-group-name /promisetelemetry/payment --retention-in-days 30 --region "${AWS_REGION}"
    aws logs put-retention-policy --log-group-name /promisetelemetry/orders --retention-in-days 30 --region "${AWS_REGION}"
    aws logs put-retention-policy --log-group-name /promisetelemetry/auth --retention-in-days 30 --region "${AWS_REGION}"
    aws logs put-retention-policy --log-group-name /promisetelemetry/otel --retention-in-days 7 --region "${AWS_REGION}"

    echo "==> CloudWatch log groups ready."
}

show_help() {
    echo "PromiseTelemetry AWS Deployment"
    echo ""
    echo "Usage: ./deploy.sh <command>"
    echo ""
    echo "Commands:"
    echo "  ecr-setup    Create ECR repository"
    echo "  push         Build Docker image and push to ECR"
    echo "  ecs-deploy   Register ECS task definition and create cluster"
    echo "  logs-setup   Create CloudWatch log groups with retention policies"
    echo "  all          Run all steps in sequence"
    echo "  help         Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  - AWS CLI configured (aws configure)"
    echo "  - Docker installed and running"
    echo "  - IAM user with ECR, ECS, CloudWatch permissions"
}

case "${command}" in
    ecr-setup)   ecr_setup ;;
    push)        build_and_push ;;
    ecs-deploy)  ecs_deploy ;;
    logs-setup)  logs_setup ;;
    all)
        ecr_setup
        build_and_push
        ecs_deploy
        logs_setup
        echo ""
        echo "==> All deployment steps complete."
        ;;
    help|*)      show_help ;;
esac
