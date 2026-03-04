# PostGenie AI

AI-powered content intelligence platform that helps creators, startups, and brands transform a single idea into platform-optimized digital content for LinkedIn, Instagram, X, and short-form videos.

## 🚀 Quick Start

**New to the project?** See [QUICKSTART.md](QUICKSTART.md) to get running in 5 minutes!

**Detailed setup?** See [SETUP.md](SETUP.md) for comprehensive instructions.

**Running the app?** See [RUNNING.md](RUNNING.md) for development workflow.

## Features

- 🤖 AI-powered content generation using AWS Bedrock
- 🎯 Platform-specific content optimization
- 📊 Voice profile analysis and learning
- 🔄 Multi-platform publishing
- 📈 Continuous learning from user posts
- 🔐 Secure OAuth integration

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: AWS Lambda + Node.js + TypeScript
- **Infrastructure**: AWS CDK
- **Database**: Amazon DynamoDB
- **AI/ML**: AWS Bedrock (Fine-tuned models + RAG)
- **Storage**: Amazon Knowledge Base
- **Secrets**: AWS Secrets Manager

## Project Structure

```
postgenie-ai/
├── frontend/           # React frontend application
├── backend/            # Lambda functions
├── infrastructure/     # AWS CDK infrastructure code
└── .kiro/             # Spec-driven development files
    └── specs/
        └── ai-social-content-manager/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## Getting Started

### Quick Start

**Option 1: Automated Setup (Recommended)**

Linux/Mac:
```bash
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

Windows:
```bash
scripts\dev-setup.bat
```

**Option 2: Manual Setup**

1. Install dependencies:
```bash
npm install
```

2. Build backend:
```bash
cd backend
npm run build
```

3. Deploy to AWS:
```bash
cd infrastructure
cdk bootstrap  # First time only
cdk deploy
```

4. Configure frontend with your API URL:
```bash
cd frontend
cp .env.example .env
# Edit .env with your API Gateway URL
```

5. Run the frontend:
```bash
npm run dev
```

### Detailed Instructions

See [RUNNING.md](RUNNING.md) for complete setup and deployment instructions.

## Implementation Progress

This project follows spec-driven development. See `.kiro/specs/ai-social-content-manager/tasks.md` for the implementation plan.

- [x] Task 1: Set up project structure and AWS infrastructure
- [ ] Task 2: Implement authentication and user management
- [ ] Task 3: Implement OAuth integration
- [ ] Task 4: Implement voice profile analysis
- [ ] Task 5: Checkpoint
- [ ] Task 6: Implement AWS Bedrock model fine-tuning
- [ ] Task 7: Implement content generation frontend
- [ ] Task 8: Implement content generation backend
- [ ] Task 9: Checkpoint
- [ ] Task 10: Implement content review and editing
- [ ] Task 11: Implement content publishing
- [ ] Task 12: Implement continuous learning system
- [ ] Task 13: Checkpoint
- [ ] Task 14: Implement comprehensive error handling
- [ ] Task 15: Implement frontend UI components
- [ ] Task 16: Final Checkpoint

## License

MIT