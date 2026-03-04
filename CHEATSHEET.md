# PostGenie AI - Developer Cheat Sheet

Quick reference for common development tasks.

## 📦 Installation & Setup

```bash
# One-time setup
npm run setup

# Or step by step
npm install
cd backend && npm run build
```

## 🚀 Running the Application

```bash
# Run frontend (http://localhost:3000)
npm run frontend

# Or from frontend directory
cd frontend && npm run dev
```

## 🏗️ Building

```bash
# Build everything
npm run build

# Build backend only
npm run build:backend

# Build infrastructure only
npm run build:infra
```

## ☁️ AWS Deployment

```bash
# Deploy everything (builds + deploys)
npm run deploy

# Or manually
cd backend && npm run build
cd ../infrastructure && npm run build && cdk deploy

# First time only
cd infrastructure && cdk bootstrap

# View what will change
cd infrastructure && cdk diff

# Destroy everything (careful!)
cd infrastructure && cdk destroy
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
cd backend && npm test

# Frontend tests only
cd frontend && npm test

# Test API endpoints
./scripts/test-api.sh https://YOUR-API-URL
```

## 🔍 Debugging

```bash
# View Lambda logs (live)
aws logs tail /aws/lambda/PostGenieStack-RegisterFunction --follow
aws logs tail /aws/lambda/PostGenieStack-LoginFunction --follow

# List all Lambda functions
aws lambda list-functions | grep PostGenie

# View DynamoDB tables
aws dynamodb list-tables
aws dynamodb scan --table-name PostGenie-Users

# View API Gateway endpoints
aws apigateway get-rest-apis
```

## 📝 Common Tasks

### Add a new Lambda function

1. Create function in `backend/src/functions/`
2. Build: `cd backend && npm run build`
3. Add to `infrastructure/lib/postgenie-stack.ts`
4. Deploy: `cd infrastructure && cdk deploy`

### Update environment variables

Edit in `infrastructure/lib/postgenie-stack.ts`:
```typescript
environment: {
  MY_VAR: 'value',
}
```

Then redeploy: `cd infrastructure && cdk deploy`

### Add a new DynamoDB table

Edit `infrastructure/lib/postgenie-stack.ts`:
```typescript
const myTable = new dynamodb.Table(this, 'MyTable', {
  tableName: 'PostGenie-MyTable',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
});
```

### Add a new API endpoint

1. Create Lambda function
2. Add to infrastructure:
```typescript
const myResource = api.root.addResource('my-endpoint');
myResource.addMethod('POST', new apigateway.LambdaIntegration(myFunction));
```

### Query DynamoDB from Lambda

```typescript
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, TABLES } from '../config/dynamodb';

const result = await dynamoDb.send(
  new GetCommand({
    TableName: TABLES.USERS,
    Key: { userId: 'some-id' },
  })
);
```

## 🔐 Authentication

### Register a user
```bash
curl -X POST https://API-URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass1234"}'
```

### Login
```bash
curl -X POST https://API-URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass1234"}'
```

### Use authenticated endpoint
```bash
curl -X GET https://API-URL/some-protected-endpoint \
  -H "Authorization: Bearer YOUR-JWT-TOKEN"
```

## 📂 Project Structure

```
postgenie-ai/
├── frontend/              # React app
│   ├── src/
│   │   ├── components/   # React components
│   │   └── main.tsx      # Entry point
│   └── package.json
├── backend/              # Lambda functions
│   ├── src/
│   │   ├── functions/    # Lambda handlers
│   │   ├── repositories/ # Data access layer
│   │   ├── utils/        # Utilities
│   │   └── types/        # TypeScript types
│   └── package.json
├── infrastructure/       # AWS CDK
│   ├── lib/
│   │   └── postgenie-stack.ts  # Main stack
│   └── package.json
└── .kiro/specs/         # Spec-driven development
    └── ai-social-content-manager/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

## 🛠️ Useful AWS CLI Commands

```bash
# Configure AWS credentials
aws configure

# Check current identity
aws sts get-caller-identity

# List CloudFormation stacks
aws cloudformation list-stacks

# Get stack outputs
aws cloudformation describe-stacks --stack-name PostGenieStack

# Update Secrets Manager
aws secretsmanager update-secret \
  --secret-id PostGenie/OAuth \
  --secret-string '{"linkedin":{"clientId":"..."}}'
```

## 🐛 Common Issues

### "Cannot find module" in Lambda
```bash
cd backend && npm run build
cd ../infrastructure && cdk deploy
```

### CORS errors
- Check `frontend/.env` has correct API URL
- Ensure URL ends with `/prod`
- Verify CORS is configured in API Gateway

### DynamoDB access denied
- Check Lambda execution role has permissions
- Verify table names match environment variables

### JWT token invalid
- Check JWT_SECRET is set consistently
- Token expires after 24 hours by default

## 📚 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Get started in 5 minutes
- [SETUP.md](SETUP.md) - Detailed setup instructions
- [RUNNING.md](RUNNING.md) - Development workflow
- [README.md](README.md) - Project overview
- `.kiro/specs/ai-social-content-manager/design.md` - Architecture
- `.kiro/specs/ai-social-content-manager/requirements.md` - Requirements
- `.kiro/specs/ai-social-content-manager/tasks.md` - Implementation plan

## 🎯 Current Status

✅ Completed:
- Project structure
- Authentication (register/login)
- DynamoDB setup
- API Gateway
- Lambda functions

🔄 In Progress:
- OAuth integration (Task 3)

📋 Upcoming:
- Voice profile analysis
- AWS Bedrock integration
- Content generation
- Multi-platform publishing

## 💡 Tips

- Use `cdk watch` for auto-deployment during development
- Check CloudWatch logs for debugging
- Use DynamoDB Local for offline development
- Set up AWS profiles for multiple environments
- Use environment variables for configuration
- Keep JWT_SECRET secure and rotate regularly

## 🆘 Getting Help

1. Check this cheat sheet
2. Review [RUNNING.md](RUNNING.md)
3. Check CloudWatch logs
4. Review the design document
5. Check AWS Console for resource status
