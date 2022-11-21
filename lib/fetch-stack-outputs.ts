import * as cloudformation from "@aws-sdk/client-cloudformation";
import * as cdk from "aws-cdk-lib";

/**
 * {@link fetchStackOutputs} 関数の戻り値
 * CDK スタックの CloudFormation 出力を表す連想配列
 */
export type FetchStackOutputsResult = { [key: string]: string };

/** 指定された CDK スタックの出力を CloudFormation から取得する */
export const fetchStackOutputs = async (
  stack: cdk.Stack
): Promise<FetchStackOutputsResult | undefined> => {
  try {
    // CloudFormation クライアントを作成
    const client = new cloudformation.CloudFormationClient({
      region: stack.region,
    });

    // CloudFormation の describe-stacks コマンドを実行する
    // https://docs.aws.amazon.com/ja_jp/AWSCloudFormation/latest/UserGuide/using-cfn-describing-stacks.html#using-cfn-describing-stacks-describe-stacks
    const command = new cloudformation.DescribeStacksCommand({
      StackName: stack.stackName,
    });
    const response = await client.send(command);

    // Outputs の内容を連想配列形式に変換して返す
    return response.Stacks?.[0]?.Outputs?.reduce((result, output) => {
      if (output.OutputKey && output.OutputValue) {
        result[output.OutputKey] = output.OutputValue;
      }
      return result;
    }, {} as FetchStackOutputsResult);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.stack);
    }
    return undefined;
  }
};
