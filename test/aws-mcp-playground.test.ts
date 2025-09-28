import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as AwsMcpPlayground from '../lib/aws-mcp-playground-stack';

test('Lambda Function Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AwsMcpPlayground.AwsMcpPlaygroundStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs22.x',
    Handler: 'lambda.handler',
  });
});

test('API Gateway Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new AwsMcpPlayground.AwsMcpPlaygroundStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::ApiGateway::RestApi', {
    Name: 'MCP Server API',
  });
});
