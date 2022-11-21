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
            // ビルドの出力が複数のファイルで構成されている場合の設定
            outputType: cdk.BundlingOutput.NOT_ARCHIVED,
            // ビルドを実行する Docker コンテナのイメージを指定
            image: cdk.DockerImage.fromRegistry(
              "public.ecr.aws/docker/library/node:16-bullseye"
            ),
            // ビルド時の環境変数に、バックエンドが出力した各種設定を反映する
            environment: {
              // バックエンド API の URL
              VITE_APPSYNC_ENDPOINT: props.graphqlEndpoint,
              VITE_APPSYNC_API_KEY: props.apiKey,
              VITE_APPSYNC_REGION: props.apiRegion,
            },
            // ビルドを実行する Docker コンテナ内のユーザー
            user: "node",
            // ビルドを実行するためのコマンド
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
      retainOnDelete: false, // デプロイ時にcloudfrontのキャッシュを削除
    });

    new cdk.CfnOutput(this, "CloudFrontDeploy", {
      value: cloudFrontWebDistribution.domainName,
    });
  }
}
