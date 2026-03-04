# Running PostGenie AI

This guide explains how to run the PostGenie AI application locally and deploy it to AWS.

## Prerequisites

Ensure you have completed the setup steps in [SETUP.md](SETUP.md) first.

## Quick Start

### 1. Install Dependencies

From the project root:

```bash
# Install all dependencies for all workspaces
npm install
```

This will install dependencies for:
- Root workspace
- Frontend (React app)
- Backend (Lambda functions)
- Infrastructure (AWS CDK)

### 2. Build the Backend

The Lambda functions need to be compiled from TypeScript to JavaScript:

```bash
cd backend
npm run build
```

This creates the `dist/` folder with compiled JavaScript files.

### 3. Deploy Infrastructure to AWS

```bash
cd infrastructure

# First time only: Bootstrap CDK
cdk bootstrap

# Build the infrastructure code
npm run build

# Deploy to AWS
cdk deploy
```

**Important**: After deployment, note the API Gateway URL from the outputs. It will look like:
```
PostGenieStack.ApiUrl = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

### 4. Configure Frontend Environment

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` and add your API Gateway URL:

```env
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/api
VITE_AWS_REGION=us-east-1
```

### 5. Run the Frontend

```bash
cd frontend
npm run dev
```

The application will be available at: **http://localhost:3000**

## Testing the Application

### Test User Registration

Using curl:

```bash
curl -X POST https://your-api-gateway-url/prod/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "uuid-here",
      "email": "test@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
}
```

### Test User Login

```bash
curl -X POST https://your-api-gateway-url/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

### Using the Frontend

1. Open http://localhost:3000
2. You should see the PostGenie AI welcome page
3. (Authentication UI will be added in Task 15)

## Development Workflow

### Making Backend Changes

1. Edit Lambda function code in `backend/src/`
2. Rebuild:
   ```bash
   cd backend
   npm run build
   ```
3. Redeploy:
   ```bash
   cd infrastructure
   cdk deploy
   ```

### Making Frontend Changes

The Vite dev server has hot reload enabled. Just save your changes and they'll appear automatically.

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
cd backend
npm test

# Run frontend tests only
cd frontend
npm test
```

## Viewing AWS Resources

### DynamoDB Tables

```bash
# List all tables
aws dynamodb list-tables

# Scan Users table
aws dynamodb scan --table-name PostGenie-Users
```

### Lambda Functions

```bash
# List functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `PostGenieStack`)].FunctionName'

# View logs
aws logs tail /aws/lambda/PostGenieStack-RegisterFunction --follow
```

### API Gateway

View your API in the AWS Console:
1. Go to API Gateway
2. Find "PostGenie API"
3. Click "Stages" → "prod" to see all endpoints

## Troubleshooting

### "Cannot find module" errors

Make sure you've built the backend:
```bash
cd backend
npm run build
```

### Lambda function errors

Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/PostGenieStack-RegisterFunction --follow
```

### CORS errors in browser

The API Gateway is configured with CORS. If you still see errors:
1. Check that your frontend `.env` has the correct API URL
2. Ensure the API Gateway deployment is complete
3. Try redeploying: `cd infrastructure && cdk deploy`

### DynamoDB access errors

Verify the Lambda execution role has permissions:
```bash
aws iam get-role --role-name PostGenieStack-LambdaExecutionRole
```

### "Email already registered" error

The email is already in the database. Either:
1. Use a different email
2. Delete the user from DynamoDB:
   ```bash
   aws dynamodb delete-item \
     --table-name PostGenie-Users \
     --key '{"userId": {"S": "user-id-here"}}'
   ```

## Environment Variables

### Backend Environment Variables

Set in `infrastructure/lib/postgenie-stack.ts` when creating Lambda functions:

- `USERS_TABLE` - DynamoDB Users table name
- `CONNECTIONS_TABLE` - DynamoDB Connections table name
- `VOICE_PROFILES_TABLE` - DynamoDB VoiceProfiles table name
- `MODELS_TABLE` - DynamoDB Models table name
- `POSTS_TABLE` - DynamoDB Posts table name
- `JWT_SECRET` - Secret key for JWT tokens (set via environment variable before deploy)
- `AWS_REGION` - AWS region (automatically set by Lambda)

### Setting JWT Secret

Before deploying, set a secure JWT secret:

```bash
export JWT_SECRET="your-very-secure-random-string-here"
cd infrastructure
cdk deploy
```

Or update the Lambda function environment variables in AWS Console after deployment.

## Deployment Checklist

Before deploying to production:

- [ ] Set a strong JWT_SECRET environment variable
- [ ] Configure OAuth credentials in AWS Secrets Manager
- [ ] Enable CloudWatch alarms for Lambda errors
- [ ] Set up DynamoDB backups
- [ ] Configure custom domain for API Gateway
- [ ] Enable API Gateway access logging
- [ ] Review IAM permissions (principle of least privilege)
- [ ] Set up AWS WAF for API protection
- [ ] Configure rate limiting on API Gateway

## Next Steps

Now that the application is running:

1. Continue implementing features from the task list
2. Test each endpoint as you build it
3. Monitor CloudWatch logs for errors
4. Use the frontend to interact with the API

For the next task (Task 3: OAuth integration), you'll need to:
1. Register apps with LinkedIn, Twitter, Instagram, Facebook
2. Get OAuth client IDs and secrets
3. Store them in AWS Secrets Manager
4. Implement the OAuth flow handlers

## Useful Commands

```bash
# View all CDK stacks
cdk list

# View differences before deploying
cdk diff

# Destroy all resources (careful!)
cdk destroy

# View CloudFormation template
cdk synth

# Watch for changes and auto-deploy (development only)
cd infrastructure
cdk watch
```

## Getting Help

- Check [SETUP.md](SETUP.md) for initial setup
- Review [README.md](README.md) for project overview
- See `.kiro/specs/ai-social-content-manager/design.md` for architecture details
- Check AWS CloudWatch logs for runtime errors
