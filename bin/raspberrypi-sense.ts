#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { RaspberrypiSenseStack } from "../lib/raspberrypi-sense-stack";
import { FrontendStack } from "../lib/frontend-stack";
import { fetchStackOutputs } from "../lib/fetch-stack-outputs";

const app = new cdk.App();
const senseStack = new RaspberrypiSenseStack(app, "RaspberrypiSenseStack", {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

createFrontend();

async function createFrontend() {
  const outputs = await fetchStackOutputs(senseStack);
  if (outputs) {
    const frontStack = new FrontendStack(app, "FrontendStack", {
      graphqlEndpoint: outputs.ApiGraphqlEndpoint,
      apiKey: outputs.ApiKey,
      apiRegion: process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });
  }
}
