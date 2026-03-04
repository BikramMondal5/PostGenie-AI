# AWS Setup for PostGenie AI

Before deploying PostGenie AI to AWS, you need to configure your AWS credentials.

## Step 1: Create an AWS Account

If you don't have an AWS account:
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the registration process

## Step 2: Create an IAM User

1. Log in to AWS Console
2. Go to IAM (Identity and Access Management)
3. Click "Users" → "Create user"
4. User name: `postgenie-deployer`
5. Select "Provide user access to the AWS Management Console" (optional)
6. Click "Next"

## Step 3: Attach Permissions

Attach these policies to the user:
- `AdministratorAccess` (for development)
  
  **Note**: For production, use more restrictive policies:
  - `AWSLambdaFullAccess`
  - `AmazonDynamoDBFullAccess`
  - `AmazonAPIGatewayAdministrator`
  - `IAMFullAccess`
  - `AWSCloudFormationFullAccess`
  - `AmazonBedrockFullAccess`

## Step 4: Create Access Keys

1. Click on the created user
2. Go to "Security credentials" tab
3. Scroll to "Access keys"
4. Click "Create access key"
5. Select "Command Line Interface (CLI)"
6. Check the confirmation box
7. Click "Create access key"
8. **IMPORTANT**: Save both:
   - Access key ID
   - Secret access key

## Step 5: Configure AWS CLI

Open your terminal and run:

```bash
aws configure
```

Enter the following when prompted:
```
AWS Access Key ID: [Your Access Key ID]
AWS Secret Access Key: [Your Secret Access Key]
Default region name: us-east-1
Default output format: json
```

## Step 6: Verify Configuration

Test your AWS configuration:

```bash
# Check your identity
aws sts get-caller-identity

# List S3 buckets (should work even if empty)
aws s3 ls
```

Expected output:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/postgenie-deployer"
}
```

## Step 7: Bootstrap CDK (One-time)

CDK needs to bootstrap your AWS environment:

```bash
cd infrastructure
cdk bootstrap
```

This creates:
- S3 bucket for CDK assets
- IAM roles for deployments
- CloudFormation stack

Expected output:
```
 ✅  Environment aws://123456789012/us-east-1 bootstrapped
``` 

## Step 8: Deploy PostGenie AI

Now you're ready to deploy:

```bash
cd infrastructure
npm run build
cdk deploy
```

Review the changes and type `y` to confirm.

## Troubleshooting

### "Unable to locate credentials"

Your AWS credentials aren't configured. Run:
```bash
aws configure
```

### "Access Denied" errors

Your IAM user doesn't have sufficient permissions. Add the required policies in IAM console.

### "Region not specified"

Set your default region:
```bash
aws configure set region us-east-1
```

### CDK Bootstrap fails

Ensure your IAM user has CloudFormation and S3 permissions.

## Security Best Practices

1. **Never commit AWS credentials** to Git
2. **Use IAM roles** in production instead of access keys
3. **Enable MFA** on your AWS account
4. **Rotate access keys** regularly
5. **Use AWS Secrets Manager** for sensitive data
6. **Enable CloudTrail** for audit logging
7. **Set up billing alerts** to avoid unexpected charges

## Cost Estimation

PostGenie AI uses these AWS services:

- **DynamoDB**: Pay-per-request (very low cost for development)
- **Lambda**: First 1M requests/month free
- **API Gateway**: First 1M requests/month free
- **Bedrock**: Pay per token (can be expensive)
- **S3**: Minimal storage costs

**Estimated monthly cost for development**: $5-20
**Estimated monthly cost with Bedrock usage**: $50-200+

## Next Steps

After AWS is configured:

1. Deploy the infrastructure: `cd infrastructure && cdk deploy`
2. Note the API Gateway URL from the output
3. Update `frontend/.env` with the API URL
4. Run the frontend: `cd frontend && npm run dev`

## Useful AWS CLI Commands

```bash
# View CloudFormation stacks
aws cloudformation list-stacks

# View DynamoDB tables
aws dynamodb list-tables

# View Lambda functions
aws lambda list-functions

# View API Gateway APIs
aws apigateway get-rest-apis

# View CloudWatch logs
aws logs tail /aws/lambda/PostGenieStack-RegisterFunction --follow
```

## Getting Help

- AWS Documentation: https://docs.aws.amazon.com/
- AWS CLI Reference: https://docs.aws.amazon.com/cli/
- CDK Documentation: https://docs.aws.amazon.com/cdk/
- PostGenie AI docs: See RUNNING.md
