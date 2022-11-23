import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iot from "aws-cdk-lib/aws-iot";
import * as iot_alpha from "@aws-cdk/aws-iot-alpha";
import * as iot_actions from "@aws-cdk/aws-iot-actions";
import * as iam from "aws-cdk-lib/aws-iam";
import * as greengrass from "aws-cdk-lib/aws-greengrassv2";
import * as pythonLambda from "@aws-cdk/aws-lambda-python-alpha";
// import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodeLambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import { IFunction, Runtime } from "aws-cdk-lib/aws-lambda";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import { Duration, Expiration, RemovalPolicy } from "aws-cdk-lib";
import { v5 as uuidv5 } from "uuid";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

export class RaspberrypiSenseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const THING_NAME = "raspi-bme280";
    const THING_GROUP_NAME = "raspi-bme280-group";
    const CERT_ARN = this.node.tryGetContext("certArn");
    const TOPIC_PREFIX = "rpi";

    // モノの作成
    const thing = new iot.CfnThing(this, "Thing", {
      thingName: THING_NAME,
    });

    // ポリシーの作成
    const iotPolicy = new iot.CfnPolicy(this, "Policy", {
      policyName: "GreengrassPolicy",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "iot:Publish",
              "iot:Subscribe",
              "iot:Connect",
              "iot:Receive",
            ],
            Resource: ["*"],
          },
          {
            Effect: "Allow",
            Action: [
              "iot:GetThingShadow",
              "iot:UpdateThingShadow",
              "iot:DeleteThingShadow",
            ],
            Resource: ["*"],
          },
          {
            Effect: "Allow",
            Action: ["greengrass:*"],
            Resource: ["*"],
          },
          // fetch artifact from s3 bucket which contains built gdk component
          {
            Effect: "Allow",
            Action: ["s3:*", "s3-object-lambda:*"],
            Resource: "*",
          },
        ],
      },
    });

    // ポリシーを証明書にアタッチ
    const policyPrincipalAttachment = new iot.CfnPolicyPrincipalAttachment(
      this,
      "PolicyPrincipalAttachment",
      {
        policyName: iotPolicy.policyName!,
        principal: CERT_ARN,
      }
    );
    policyPrincipalAttachment.addDependsOn(iotPolicy);

    // モノを証明書にアタッチ
    const thingPrincipalAttachment = new iot.CfnThingPrincipalAttachment(
      this,
      "THingPrincipalAttachment",
      {
        thingName: thing.thingName!,
        principal: CERT_ARN,
      }
    );
    thingPrincipalAttachment.addDependsOn(thing);

    // Database
    // const table = new ddb.Table(this, "SenserTable", {
    //   partitionKey: { name: "room_name", type: ddb.AttributeType.STRING },
    //   sortKey: { name: "timestamp", type: ddb.AttributeType.NUMBER },
    //   billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    //   timeToLiveAttribute: "expiration_timestamp",
    //   removalPolicy: RemovalPolicy.DESTROY,
    // });
    const table = new ddb.Table(this, "Table", {
      partitionKey: { name: "room_name", type: ddb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: ddb.AttributeType.NUMBER },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "expiration_timestamp",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // appsync api auth handler
    const authKey = uuidv5(
      process.env.CDK_DEFAULT_ACCOUNT || "seed",
      uuidv5.URL
    );
    const authHandler = new nodeLambda.NodejsFunction(this, "AuthHandler", {
      entry: path.join(__dirname, "../lambda/auth/index.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        LAMBDA_API_KEY: authKey,
      },
      logRetention: RetentionDays.FIVE_DAYS,
    });

    // AppSync
    const api = new appsync.GraphqlApi(this, "Api", {
      name: "dashboard-api",
      schema: appsync.Schema.fromAsset(
        path.join(__dirname, "../app/schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
        additionalAuthorizationModes: [
          // {
          //   authorizationType: appsync.AuthorizationType.API_KEY,
          //   apiKeyConfig: {
          //     expires: Expiration.after(Duration.days(365)),
          //   },
          // },
          {
            authorizationType: appsync.AuthorizationType.LAMBDA,
            lambdaAuthorizerConfig: {
              handler: authHandler,
            },
          },
        ],
      },
      xrayEnabled: false,
    });

    // action lambda function
    const topicActionFunc = new pythonLambda.PythonFunction(
      this,
      "TopicActionFunc",
      {
        entry: path.join(__dirname, "../lambda/rule_action"),
        runtime: Runtime.PYTHON_3_9,
        environment: {
          TABLE_NAME: table.tableName,
          APPSYNC_URL: api.graphqlUrl,
        },
        logRetention: RetentionDays.FIVE_DAYS,
      }
    );
    topicActionFunc.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AWSAppSyncInvokeFullAccess")
    );

    table.grantReadWriteData(topicActionFunc);
    api.grantMutation(topicActionFunc);
    topicActionFunc.addPermission("TopicRuleInvoke", {
      principal: new iam.ServicePrincipal("iot.amazonaws.com"),
    });

    // rule
    const topicRule = new iot.CfnTopicRule(this, "TopicRule", {
      topicRulePayload: {
        ruleDisabled: false,
        actions: [
          {
            lambda: {
              functionArn: topicActionFunc.functionArn,
            },
          },
        ],
        sql: `select * from '${TOPIC_PREFIX}/+'`,
      },
    });

    // api handler
    const apiHandler = new pythonLambda.PythonFunction(this, "ApiHandler", {
      entry: path.join(__dirname, "../lambda/api"),
      runtime: Runtime.PYTHON_3_9,
      environment: {
        TABLE_NAME: table.tableName,
      },
      timeout: Duration.seconds(60),
      logRetention: RetentionDays.FIVE_DAYS,
    });
    table.grantReadWriteData(apiHandler);
    apiHandler.addPermission("ApiHandlerInvoke", {
      principal: new iam.ServicePrincipal("appsync.amazonaws.com"),
    });

    // lambda datasource
    const lambdaDs = api.addLambdaDataSource("LambdaDs", apiHandler);

    // add resolvers
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getDemos",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    lambdaDs.createResolver({
      typeName: "Query",
      fieldName: "getMeasurements",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });
    lambdaDs.createResolver({
      typeName: "Mutation",
      fieldName: "postMeasurement",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    /**
     * OUtputs
     */
    new cdk.CfnOutput(this, "GreengrassInstallCommand", {
      value: `sudo -E java -Droot="/greengrass/v2" -Dlog.store=FILE \
      -jar ./GreengrassInstaller/lib/Greengrass.jar \
      --aws-region ${cdk.Stack.of(this).region} \
      --thing-name ${THING_NAME} \
      --thing-group-name ${THING_GROUP_NAME} \
      --thing-policy-name ${iotPolicy.policyName} \
      --component-default-user ggc_user:ggc_group \
      --provision true \
      --setup-system-service true \
      --deploy-dev-tools true`,
      exportName: "GreengrassInstallCommand",
    });

    new cdk.CfnOutput(this, "ApiKey", {
      value: api.apiKey ?? "no api key",
    });

    new cdk.CfnOutput(this, "ApiGraphqlEndpoint", {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, "LambdaApiKey", {
      value: authKey,
    });
  }
}
