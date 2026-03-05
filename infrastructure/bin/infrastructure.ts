#!/usr/bin/env node
import 'source-map-support/register';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental variables from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import * as cdk from 'aws-cdk-lib';
import { PostGenieStack } from '../lib/postgenie-stack';

const app = new cdk.App();

new PostGenieStack(app, 'PostGenieStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'PostGenie AI - Content Intelligence Platform Infrastructure'
});

app.synth();
