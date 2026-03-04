# PostGenie AI - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **AWS CLI** configured with appropriate credentials
- **AWS CDK CLI** (`npm install -g aws-cdk`)
- **Git**

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm install --workspaces
```

### 2. Configure Environment Variables

#### Frontend Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your configuration:
```
VITE_API_URL=https://your-api-gateway-url/api
VITE_AWS_REGION=us-east-1
```

#### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration.

### 3. AWS Infrastructure Setup

#### Bootstrap CDK (First time only)

```bash
cd infrastructure
cdk bootstrap
```

#### Deploy Infrastructure

```bash
cd infrastructure
npm run build
cdk deploy
```

This will create:
- DynamoDB tables (Users, Connections, VoiceProfiles, Models, Posts)
- API Gateway
- Lambda execution roles
- Secrets Manager for OAuth credentials
- CloudWatch log groups

After deployment, note the API Gateway URL from the outputs.

### 4. Configure OAuth Credentials

After infrastructure deployment, update the OAuth secrets in AWS Secrets Manager:

```bash
aws secretsmanager update-secret \
  --secret-id PostGenie/OAuth \
  --secret-string '{
    "linkedin": {
      "clientId": "your-linkedin-client-id",
      "clientSecret": "your-linkedin-client-secret"
    },
    "twitter": {
      "clientId": "your-twitter-client-id",
      "clientSecret": "your-twitter-client-secret"
    },
    "instagram": {
      "clientId": "your-instagram-client-id",
      "clientSecret": "your-instagram-client-secret"
    },
    "facebook": {
      "clientId": "your-facebook-client-id",
      "clientSecret": "your-facebook-client-secret"
    }
  }'
```

### 5. Run Development Server

```bash
# From project root
npm run frontend
```

The frontend will be available at `http://localhost:3000`

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests only
npm test --workspace=frontend

# Run backend tests only
npm test --workspace=backend
```

### Building for Production

```bash
# Build all workspaces
npm run build

# Build frontend only
npm run build --workspace=frontend

# Build backend only
npm run build --workspace=backend
```

### Deploying Updates

```bash
cd infrastructure
npm run build
cdk deploy
```

## AWS Bedrock Setup

### Enable Bedrock Models

1. Go to AWS Bedrock console
2. Navigate to "Model access"
3. Request access to:
   - Claude 3 (Anthropic)
   - Llama 2 (Meta)
4. Wait for approval (usually instant for most models)

### Create Knowledge Base

1. Go to AWS Bedrock console
2. Navigate to "Knowledge bases"
3. Create a new knowledge base:
   - Name: `PostGenie-KnowledgeBase`
   - Data source: S3 bucket (will be created)
   - Embedding model: Titan Embeddings G1

## Troubleshooting

### CDK Deployment Issues

If you encounter permission errors:
```bash
# Ensure your AWS credentials have sufficient permissions
aws sts get-caller-identity

# Check CDK version
cdk --version
```

### DynamoDB Access Issues

Verify table names match environment variables:
```bash
aws dynamodb list-tables
```

### Lambda Function Errors

Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/PostGenie-FunctionName --follow
```

## Next Steps

After setup is complete:

1. Review the implementation tasks in `.kiro/specs/ai-social-content-manager/tasks.md`
2. Start implementing features following the task list
3. Run tests regularly to ensure correctness
4. Deploy updates as features are completed

## Support

For issues or questions, refer to:
- Design document: `.kiro/specs/ai-social-content-manager/design.md`
- Requirements: `.kiro/specs/ai-social-content-manager/requirements.md`
- Tasks: `.kiro/specs/ai-social-content-manager/tasks.md`
