import { Construct } from "constructs";
import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import * as lambdaPython from "@aws-cdk/aws-lambda-python-alpha";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";

export interface FrontendStackProps extends StackProps {
  graphqlEndpoint: string;
  apiKey: string;
  apiRegion: string;
  lambdaApiKey: string;
}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    /**
     * Frontend
     */
    const { s3Bucket, cloudFrontWebDistribution } = new CloudFrontToS3(
      this,
      "CloudFrontToS3",
      {
        bucketProps: {
          removalPolicy: RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          versioned: false,
        },
        loggingBucketProps: {
          removalPolicy: RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          versioned: false,
        },
        cloudFrontDistributionProps: { RemovalPolicy: RemovalPolicy.DESTROY },
        insertHttpSecurityHeaders: false,
      }
    );
    new s3deploy.BucketDeployment(this, "S3Deploy", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../app"), {
          bundling: {
            outputType: cdk.BundlingOutput.NOT_ARCHIVED,
            image: cdk.DockerImage.fromRegistry(
              "public.ecr.aws/docker/library/node:16-bullseye"
            ),
            environment: {
              VITE_APPSYNC_ENDPOINT: props.graphqlEndpoint,
              VITE_APPSYNC_API_KEY: props.apiKey,
              VITE_APPSYNC_REGION: props.apiRegion,
              // NOTE: embed api key as env is not secure.
              VITE_LAMBDA_API_KEY: props.lambdaApiKey,
            },
            user: "node",
            command: [
              "bash",
              "-c",
              [
                "npm install --loglevel=error",
                "npm run build",
                "cp -r dist/* /asset-output/",
              ].join(" && "),
            ],
          },
        }),
      ],
      destinationBucket: s3Bucket!,
      distribution: cloudFrontWebDistribution,
      distributionPaths: ["/*"],
      retainOnDelete: false,
    });

    new cdk.CfnOutput(this, "CloudFrontDeploy", {
      value: cloudFrontWebDistribution.domainName,
    });
  }
}
