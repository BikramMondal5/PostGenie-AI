#!/bin/bash

echo "Building frontend..."
cd frontend
npm run build

echo "Deploying infrastructure..."
cd ../infrastructure
cdk deploy --require-approval never

echo "Deployment complete!"
echo "Note: CloudFront may take 5-10 minutes to propagate changes globally"
echo "You can invalidate the cache manually with:"
echo "aws cloudfront create-invalidation --distribution-id <YOUR_DIST_ID> --paths '/*'"
