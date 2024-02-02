import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PrimaryVpcConstruct } from './construct/primary-vpc';
import { AdditionalVpcConstruct } from './construct/additional-vpc';
import { TransitGatewayConstruct } from './construct/transit-gateway';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class WorkshopNetworkImmersionDayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const primaryVpcConstruct = new PrimaryVpcConstruct(this, 'PrimaryVpcConstruct', {})

    const additionalVpcConstruct = new AdditionalVpcConstruct(this, 'AdditionalVpcConstruct', {})

    new TransitGatewayConstruct(this, 'TransitGatewayConstruct', {
      primaryVpc: primaryVpcConstruct.primaryVpc,
      secondaryVpc: additionalVpcConstruct.secondaryVpc,
      tertiaryVpc: additionalVpcConstruct.tertiaryVpc
    })

  }
}
