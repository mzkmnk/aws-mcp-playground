import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as AwsMcpPlayground from '../lib/aws-mcp-playground-stack';

test('Lambda Function Created with Docker Image', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AwsMcpPlayground.AwsMcpPlaygroundStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  // DockerImageFunctionはPackageTypeがImageになる
  template.hasResourceProperties('AWS::Lambda::Function', {
    PackageType: 'Image',
    Timeout: 30,
    MemorySize: 512,
  });
});

test('Lambda Function URL Created with RESPONSE_STREAM', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AwsMcpPlayground.AwsMcpPlaygroundStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  // Function URLの存在確認
  template.resourceCountIs('AWS::Lambda::Url', 1);

  // Function URLの設定確認
  template.hasResourceProperties('AWS::Lambda::Url', {
    AuthType: 'NONE',
    InvokeMode: 'RESPONSE_STREAM',
    Cors: {
      AllowOrigins: ['*'],
      AllowMethods: ['*'],
      AllowHeaders: Match.arrayWith(['Content-Type', 'Mcp-Session-Id']),
      ExposeHeaders: ['Mcp-Session-Id'],
    },
  });
});

test('Stack Outputs Configured', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AwsMcpPlayground.AwsMcpPlaygroundStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  // 必要なOutputが存在することを確認
  template.hasOutput('FunctionUrl', {});
  template.hasOutput('McpEndpoint', {});
  template.hasOutput('LambdaFunctionArn', {});
});
