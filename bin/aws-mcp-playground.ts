#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsMcpPlaygroundStack } from '../lib/aws-mcp-playground-stack';

const app = new cdk.App();

new AwsMcpPlaygroundStack(app, 'AwsMcpPlaygroundStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
});
