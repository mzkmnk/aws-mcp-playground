import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';

export class AwsMcpPlaygroundStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Web AdapterがあるDockerを使用したMCPサーバ向けのLambda
    const mcpLambda = new lambda.DockerImageFunction(this, 'McpServerFunction', {
      functionName: 'AwsMcpPlayground-McpServer-v2',
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '..'), {
        file: 'Dockerfile',
        platform: Platform.LINUX_AMD64,
      }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      description: 'Remote MCP Server running on AWS Lambda with Lambda Web Adapter',
      environment: {
        NODE_ENV: 'production',
      },
    });


    const functionUrl = mcpLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'Mcp-Session-Id',
          'X-Requested-With',
        ],
        exposedHeaders: ['Mcp-Session-Id'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Output the Function URL
    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: functionUrl.url,
      description: 'Lambda Function URL (supports streaming)',
    });

    // Output the MCP endpoint URL
    new cdk.CfnOutput(this, 'McpEndpoint', {
      value: `${functionUrl.url}mcp`,
      description: 'MCP Server Endpoint URL',
    });

    // Output Lambda function ARN
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: mcpLambda.functionArn,
      description: 'Lambda Function ARN',
    });
  }
}
