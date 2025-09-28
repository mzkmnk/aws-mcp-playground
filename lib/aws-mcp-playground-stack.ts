import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class AwsMcpPlaygroundStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function for MCP server using NodejsFunction
    const mcpLambda = new NodejsFunction(this, 'McpServerFunction', {
      functionName: 'AwsMcpPlayground-McpServer',
      entry: 'src/lambda.ts',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: 'production',
      },
      description: 'Remote MCP Server running on AWS Lambda',
      bundling: {
        forceDockerBundling: false,
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'McpApi', {
      restApiName: 'MCP Server API',
      description: 'API Gateway for Remote MCP Server',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
          'X-Requested-With',
        ],
      },
      binaryMediaTypes: ['*/*'],
    });

    // Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(mcpLambda, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      proxy: true,
    });

    // API Gateway routes
    // Root resource (for health check and other endpoints)
    api.root.addMethod('ANY', lambdaIntegration);

    // Proxy resource to catch all paths
    const proxyResource = api.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', lambdaIntegration);

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    // Output the MCP endpoint URL
    new cdk.CfnOutput(this, 'McpEndpoint', {
      value: `${api.url}mcp`,
      description: 'MCP Server Endpoint URL',
    });

    // Output Lambda function ARN
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: mcpLambda.functionArn,
      description: 'Lambda Function ARN',
    });
  }
}
