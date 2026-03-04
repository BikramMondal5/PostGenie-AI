import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';

export class PostGenieStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
    const registerFunction = new lambda.Function(this, 'RegisterFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'register.handler',
      code: lambda.Code.fromAsset('../backend/dist/functions/auth'),
      role: lambdaRole,
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Auth - Login
    const loginFunction = new lambda.Function(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'login.handler',
      code: lambda.Code.fromAsset('../backend/dist/functions/auth'),
      role: lambdaRole,
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
      },
      timeout: cdk.Duration.seconds(30),
    });

    // API Gateway Routes
    const authResource = api.root.addResource('auth');
    
    const registerResource = authResource.addResource('register');
    registerResource.addMethod('POST', new apigateway.LambdaIntegration(registerFunction));

    const loginResource = authResource.addResource('login');
    loginResource.addMethod('POST', new apigateway.LambdaIntegration(loginFunction));

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
  }
}
