import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';

export class PostGenieStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Media Storage (AI Outputs)
    const mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      versioned: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Frontend Hosting Bucket
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // For SPA routing
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Distribution for Frontend
    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      defaultRootObject: 'index.html',
    });

    // Deploy Frontend to S3
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'PostGenie-Users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // Add GSI for querying by email
    usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: 'PostGenie-Connections',
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for querying by userId
    connectionsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    const voiceProfilesTable = new dynamodb.Table(this, 'VoiceProfilesTable', {
      tableName: 'PostGenie-VoiceProfiles',
      partitionKey: { name: 'profileId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for querying by userId and platform
    voiceProfilesTable.addGlobalSecondaryIndex({
      indexName: 'UserPlatformIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'platform', type: dynamodb.AttributeType.STRING },
    });

    const modelsTable = new dynamodb.Table(this, 'ModelsTable', {
      tableName: 'PostGenie-Models',
      partitionKey: { name: 'modelId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for querying by userId and platform
    modelsTable.addGlobalSecondaryIndex({
      indexName: 'UserPlatformIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'platform', type: dynamodb.AttributeType.STRING },
    });

    const postsTable = new dynamodb.Table(this, 'PostsTable', {
      tableName: 'PostGenie-Posts',
      partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for querying by userId
    postsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for scheduler queries
    postsTable.addGlobalSecondaryIndex({
      indexName: 'ScheduledAtIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'scheduledAt', type: dynamodb.AttributeType.STRING },
    });

    // Secrets Manager for OAuth credentials
    const oauthSecrets = new secretsmanager.Secret(this, 'OAuthSecrets', {
      secretName: 'PostGenie/OAuth',
      description: 'OAuth credentials for social media platforms',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          linkedin: { clientId: '', clientSecret: '' },
          twitter: { clientId: '', clientSecret: '' },
          instagram: { clientId: '', clientSecret: '' },
          facebook: { clientId: '', clientSecret: '' },
        }),
        generateStringKey: 'placeholder',
      },
    });

    // Lambda execution role with necessary permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions
    usersTable.grantReadWriteData(lambdaRole);
    connectionsTable.grantReadWriteData(lambdaRole);
    voiceProfilesTable.grantReadWriteData(lambdaRole);
    modelsTable.grantReadWriteData(lambdaRole);
    postsTable.grantReadWriteData(lambdaRole);

    // Grant Secrets Manager permissions
    oauthSecrets.grantRead(lambdaRole);

    // Grant S3 permissions
    mediaBucket.grantReadWrite(lambdaRole);

    // Grant Bedrock permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
        'bedrock:CreateModelCustomizationJob',
        'bedrock:GetModelCustomizationJob',
        'bedrock:ListModelCustomizationJobs',
      ],
      resources: ['*'],
    }));

    // API Gateway
    const api = new apigateway.RestApi(this, 'PostGenieApi', {
      restApiName: 'PostGenie API',
      description: 'API for PostGenie AI Content Intelligence Platform',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Lambda Functions
    // Auth - Register
    const registerFunction = new lambdaNodejs.NodejsFunction(this, 'RegisterFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/auth/register.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    // Auth - Login
    const loginFunction = new lambdaNodejs.NodejsFunction(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/auth/login.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    // API Gateway Routes
    const authResource = api.root.addResource('auth');

    const registerResource = authResource.addResource('register');
    registerResource.addMethod('POST', new apigateway.LambdaIntegration(registerFunction));

    const loginResource = authResource.addResource('login');
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(loginFunction));

    // User Profile
    const userProfileFunction = new lambdaNodejs.NodejsFunction(this, 'UserProfileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/user/profile.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: { minify: true, sourceMap: true },
    });

    const userResource = api.root.addResource('user');
    const profileResource = userResource.addResource('profile');
    profileResource.addMethod('GET', new apigateway.LambdaIntegration(userProfileFunction));
    profileResource.addMethod('PATCH', new apigateway.LambdaIntegration(userProfileFunction));
    profileResource.addMethod('DELETE', new apigateway.LambdaIntegration(userProfileFunction));

    // Voice - Train
    const trainVoiceFunction = new lambdaNodejs.NodejsFunction(this, 'TrainVoiceFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/voice/train.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        VOICE_PROFILES_TABLE: voiceProfilesTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(60), // AI analysis might take time
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const voiceResource = api.root.addResource('voice');
    const trainResource = voiceResource.addResource('train');
    trainResource.addMethod('POST', new apigateway.LambdaIntegration(trainVoiceFunction));

    // Voice - List
    const listVoiceProfilesFunction = new lambdaNodejs.NodejsFunction(this, 'ListVoiceProfilesFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/voice/list.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        VOICE_PROFILES_TABLE: voiceProfilesTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const profilesResource = voiceResource.addResource('profiles');
    profilesResource.addMethod('GET', new apigateway.LambdaIntegration(listVoiceProfilesFunction));

    // Voice - Manage
    const manageVoiceProfileFunction = new lambdaNodejs.NodejsFunction(this, 'ManageVoiceProfileFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/voice/manage.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        VOICE_PROFILES_TABLE: voiceProfilesTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const profileIdResource = profilesResource.addResource('{profileId}');
    profileIdResource.addMethod('PATCH', new apigateway.LambdaIntegration(manageVoiceProfileFunction));
    profileIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(manageVoiceProfileFunction));

    // Content Generation
    const generateContentFunction = new lambdaNodejs.NodejsFunction(this, 'GenerateContentFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/content/generate.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
        GROQ_API_KEY: process.env.GROQ_API_KEY || '',
      },
      timeout: cdk.Duration.seconds(60), // AI generation takes time
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const contentResource = api.root.addResource('content');
    const generateResource = contentResource.addResource('generate');
    generateResource.addMethod('POST', new apigateway.LambdaIntegration(generateContentFunction));

    // Image Generation
    const generateImageFunction = new lambdaNodejs.NodejsFunction(this, 'GenerateImageFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/content/generateImage.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
        MEDIA_BUCKET: mediaBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const generateImageResource = contentResource.addResource('generate-image');
    generateImageResource.addMethod('POST', new apigateway.LambdaIntegration(generateImageFunction));

    // OAuth Functions
    const initiateOauthFunction = new lambdaNodejs.NodejsFunction(this, 'InitiateOauthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/oauth/initiate.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: { minify: true, sourceMap: true },
    });

    const callbackOauthFunction = new lambdaNodejs.NodejsFunction(this, 'CallbackOauthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/oauth/callback.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'postgenie-secret-key-32-char-!!!',
        FRONTEND_URL: `https://${distribution.distributionDomainName}`,
      },
      timeout: cdk.Duration.seconds(30),
      bundling: { minify: true, sourceMap: true },
    });

    const oauthResource = api.root.addResource('oauth');
    const initiateResource = oauthResource.addResource('initiate');
    initiateResource.addMethod('GET', new apigateway.LambdaIntegration(initiateOauthFunction));

    const callbackResource = oauthResource.addResource('callback');
    const platformCallbackResource = callbackResource.addResource('{platform}');
    platformCallbackResource.addMethod('GET', new apigateway.LambdaIntegration(callbackOauthFunction));

    // OAuth - List Connections
    const listConnectionsFunction = new lambdaNodejs.NodejsFunction(this, 'ListConnectionsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/oauth/listConnections.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'postgenie-secret-key-32-char-!!!',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: { minify: true, sourceMap: true },
    });

    const connectionsResource = oauthResource.addResource('connections');
    connectionsResource.addMethod('GET', new apigateway.LambdaIntegration(listConnectionsFunction));

    // OAuth - Disconnect
    const disconnectOauthFunction = new lambdaNodejs.NodejsFunction(this, 'DisconnectOauthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/oauth/disconnect.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: { minify: true, sourceMap: true },
    });

    const platformConnectionsResource = connectionsResource.addResource('{platform}');
    platformConnectionsResource.addMethod('DELETE', new apigateway.LambdaIntegration(disconnectOauthFunction));

    // OAuth - Update Connection Status
    const updateConnectionFunction = new lambdaNodejs.NodejsFunction(this, 'UpdateConnectionFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/oauth/updateConnection.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: { minify: true, sourceMap: true },
    });

    platformConnectionsResource.addMethod('PATCH', new apigateway.LambdaIntegration(updateConnectionFunction));

    // Publishing
    const publishPostFunction = new lambdaNodejs.NodejsFunction(this, 'PublishPostFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/publish/handler.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        POSTS_TABLE: postsTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'postgenie-secret-key-32-char-!!!',
        MEDIA_BUCKET: mediaBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
      bundling: { minify: true, sourceMap: true },
    });

    const publishResource = api.root.addResource('publish');
    publishResource.addMethod('POST', new apigateway.LambdaIntegration(publishPostFunction));

    // Scheduler
    const schedulerFunction = new lambdaNodejs.NodejsFunction(this, 'SchedulerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../backend/src/functions/publish/scheduler.ts'),
      handler: 'handler',
      role: lambdaRole,
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        POSTS_TABLE: postsTable.tableName,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'postgenie-secret-key-32-char-!!!',
        MEDIA_BUCKET: mediaBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(60),
      bundling: { minify: true, sourceMap: true },
    });

    const rule = new events.Rule(this, 'ScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
    });
    rule.addTarget(new targets.LambdaFunction(schedulerFunction));

    // Output values
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
    });

    new cdk.CfnOutput(this, 'ConnectionsTableName', {
      value: connectionsTable.tableName,
    });

    new cdk.CfnOutput(this, 'VoiceProfilesTableName', {
      value: voiceProfilesTable.tableName,
    });

    new cdk.CfnOutput(this, 'ModelsTableName', {
      value: modelsTable.tableName,
    });

    new cdk.CfnOutput(this, 'PostsTableName', {
      value: postsTable.tableName,
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
    });
  }
}
