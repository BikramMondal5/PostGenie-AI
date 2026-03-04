# PostGenie AI - Quick Start Guide

Get PostGenie AI up and running in 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ AWS account with credentials configured
- ✅ AWS CDK CLI installed (`npm install -g aws-cdk`)

## Step 1: Setup (2 minutes)

Run the automated setup script:

**Linux/Mac:**
```bash
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

**Windows:**
```bash
scripts\dev-setup.bat
```

**Or manually:**
```bash
npm run setup
```

## Step 2: Deploy to AWS (2 minutes)

```bash
cd infrastructure

# First time only
cdk bootstrap

# Deploy
npm run build
cdk deploy
```

**Save the API Gateway URL** from the output!

## Step 3: Configure Frontend (30 seconds)

Edit `frontend/.env`:
```env
VITE_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
```

## Step 4: Run the App (30 seconds)

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 🎉

## Test the API

Test your deployed API:

```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod
```

Or manually with curl:

```bash
# Register a user
curl -X POST https://YOUR-API-URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Login
curl -X POST https://YOUR-API-URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

## What's Working Now

✅ User registration with email/password
✅ User login with JWT tokens
✅ Password hashing with bcrypt
✅ DynamoDB for user storage
✅ API Gateway with CORS
✅ Lambda functions for auth

## What's Next

The following features are planned in the task list:

- 🔄 OAuth integration (LinkedIn, Twitter, Instagram, Facebook)
- 🎯 Voice profile analysis
- 🤖 AWS Bedrock model fine-tuning
- ✍️ Content generation
- 📤 Multi-platform publishing
- 📊 Continuous learning

See `.kiro/specs/ai-social-content-manager/tasks.md` for the full implementation plan.

## Useful Commands

```bash
# Run frontend
npm run frontend

# Build backend
npm run build:backend

# Deploy everything
npm run deploy

# Run tests
npm test

# View logs
aws logs tail /aws/lambda/PostGenieStack-RegisterFunction --follow
```

## Troubleshooting

### "Module not found" errors
```bash
cd backend && npm run build
```

### CORS errors
Make sure your `frontend/.env` has the correct API URL with `/prod` at the end.

### Lambda errors
Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/PostGenieStack-RegisterFunction --follow
```

### Need more help?
- See [RUNNING.md](RUNNING.md) for detailed instructions
- See [SETUP.md](SETUP.md) for AWS configuration
- Check the design doc: `.kiro/specs/ai-social-content-manager/design.md`

## Architecture Overview

```
┌─────────────┐
│   React     │  ← You are here (localhost:3000)
│  Frontend   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │  ← Your deployed API
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Lambda    │  ← Register & Login functions
│  Functions  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DynamoDB   │  ← User data storage
└─────────────┘
```

## Current Implementation Status

- [x] Task 1: Project structure and AWS infrastructure
- [x] Task 2: Authentication and user management
- [ ] Task 3: OAuth integration
- [ ] Task 4: Voice profile analysis
- [ ] Task 5: Checkpoint
- [ ] Task 6: AWS Bedrock model fine-tuning
- [ ] Task 7: Content generation frontend
- [ ] Task 8: Content generation backend
- [ ] Task 9: Checkpoint
- [ ] Task 10: Content review and editing
- [ ] Task 11: Content publishing
- [ ] Task 12: Continuous learning system
- [ ] Task 13: Checkpoint
- [ ] Task 14: Comprehensive error handling
- [ ] Task 15: Frontend UI components
- [ ] Task 16: Final Checkpoint

Happy coding! 🚀
