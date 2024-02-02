import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

export interface TransitGatewayConstructProps {
  primaryVpc: ec2.Vpc,
  secondaryVpc: ec2.Vpc,
  tertiaryVpc: ec2.Vpc
}

export class TransitGatewayConstruct extends Construct {
  constructor(scope: Construct, id: string, props: TransitGatewayConstructProps) {
    super(scope, id);



    const cfnTransitGateway = new ec2.CfnTransitGateway(this, 'CfnTransitGateway', {
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      defaultRouteTableAssociation: 'disable',
      defaultRouteTablePropagation: 'disable',
      multicastSupport: 'enable'
    })



    // Primary VPC
    const primaryCfnTransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(this, 'PrimaryCfnTransitGatewayAttachment', {
      subnetIds: props.primaryVpc.isolatedSubnets.map(subnet => subnet.subnetId),
      transitGatewayId: cfnTransitGateway.ref,
      vpcId: props.primaryVpc.vpcId,
      options: {
        "DnsSupport": "enable",
      }
    })
    primaryCfnTransitGatewayAttachment.addDependency(cfnTransitGateway)


    let primaryCfnRoute: ec2.CfnRoute

    props.primaryVpc.privateSubnets.forEach((subnet, index) => {

      primaryCfnRoute = new ec2.CfnRoute(this, `RouteToTransitGateway-Primary-${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: props.secondaryVpc.vpcCidrBlock,
        transitGatewayId: cfnTransitGateway.ref,
      });
      primaryCfnRoute.addDependency(primaryCfnTransitGatewayAttachment)

      primaryCfnRoute = new ec2.CfnRoute(this, `RouteToTransitGateway-Primary-${index + props.primaryVpc.isolatedSubnets.length}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: props.tertiaryVpc.vpcCidrBlock,
        transitGatewayId: cfnTransitGateway.ref,
      });
      primaryCfnRoute.addDependency(primaryCfnTransitGatewayAttachment)

    });






    // Secondary VPC
    const secondaryCfnTransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(this, 'SecondaryCfnTransitGatewayAttachment', {
      subnetIds: props.secondaryVpc.isolatedSubnets.map(subnet => subnet.subnetId),
      transitGatewayId: cfnTransitGateway.ref,
      vpcId: props.secondaryVpc.vpcId,
      options: {
        "DnsSupport": "enable",
      }
    })
    secondaryCfnTransitGatewayAttachment.addDependency(cfnTransitGateway)


    let secondaryCfnRoute: ec2.CfnRoute
    props.secondaryVpc.privateSubnets.forEach((subnet, index) => {

      secondaryCfnRoute = new ec2.CfnRoute(this, `RouteToTransitGateway-Secondary-${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: "10.0.0.0/8",
        transitGatewayId: cfnTransitGateway.attrId,
      });
      secondaryCfnRoute.addDependency(secondaryCfnTransitGatewayAttachment)
    });



    // Tertiary VPC
    const tertiaryCfnTransitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(this, 'TertiaryCfnTransitGatewayAttachment', {
      subnetIds: props.tertiaryVpc.isolatedSubnets.map(subnet => subnet.subnetId),
      transitGatewayId: cfnTransitGateway.attrId,
      vpcId: props.tertiaryVpc.vpcId,
      options: {
        "DnsSupport": "enable",
      }
    })

    tertiaryCfnTransitGatewayAttachment.addDependency(cfnTransitGateway)

    let tertiaryCfnRoute: ec2.CfnRoute
    const a = props.tertiaryVpc.privateSubnets.forEach((subnet, index) => {

      tertiaryCfnRoute = new ec2.CfnRoute(this, `RouteToTransitGateway-Tertiary-${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: "10.0.0.0/8",
        transitGatewayId: cfnTransitGateway.attrId,
      });
      tertiaryCfnRoute.addDependency(tertiaryCfnTransitGatewayAttachment)
    });





    // Primary -> Secondary, Tertiary
    const sharedCfnTransitGatewayRouteTable = new ec2.CfnTransitGatewayRouteTable(this, 'SharedCfnTransitGatewayRouteTable', {
      transitGatewayId: cfnTransitGateway.attrId,
    })
    sharedCfnTransitGatewayRouteTable.addDependency(cfnTransitGateway)

    const primaryCfnTransitGatewayRouteTableAssociation = new ec2.CfnTransitGatewayRouteTableAssociation(this, 'PrimaryCfnTransitGatewayRouteTableAssociation', {
      transitGatewayAttachmentId: primaryCfnTransitGatewayAttachment.attrId,
      transitGatewayRouteTableId: sharedCfnTransitGatewayRouteTable.attrTransitGatewayRouteTableId
    })
    primaryCfnTransitGatewayRouteTableAssociation.addDependency(primaryCfnTransitGatewayAttachment)
    primaryCfnTransitGatewayRouteTableAssociation.addDependency(sharedCfnTransitGatewayRouteTable)


    const secondaryCfnTransitGatewayRouteTablePropagation = new ec2.CfnTransitGatewayRouteTablePropagation(this, 'SecondaryCfnTransitGatewayRouteTablePropagation', {
      transitGatewayAttachmentId: secondaryCfnTransitGatewayAttachment.attrId,
      transitGatewayRouteTableId: sharedCfnTransitGatewayRouteTable.attrTransitGatewayRouteTableId,
    });
    secondaryCfnTransitGatewayRouteTablePropagation.addDependency(secondaryCfnTransitGatewayAttachment)
    secondaryCfnTransitGatewayRouteTablePropagation.addDependency(sharedCfnTransitGatewayRouteTable)

    const tertiaryCfnTransitGatewayRouteTablePropagation = new ec2.CfnTransitGatewayRouteTablePropagation(this, 'TertiaryCfnTransitGatewayRouteTablePropagation', {
      transitGatewayAttachmentId: tertiaryCfnTransitGatewayAttachment.attrId,
      transitGatewayRouteTableId: sharedCfnTransitGatewayRouteTable.attrTransitGatewayRouteTableId,
    });
    tertiaryCfnTransitGatewayRouteTablePropagation.addDependency(tertiaryCfnTransitGatewayAttachment)
    tertiaryCfnTransitGatewayRouteTablePropagation.addDependency(sharedCfnTransitGatewayRouteTable)



    // Secondary, Tertiary -> Primary
    const cfnTransitGatewayRouteTable = new ec2.CfnTransitGatewayRouteTable(this, 'CfnTransitGatewayRouteTable', {
      transitGatewayId: cfnTransitGateway.attrId,
    })
    cfnTransitGatewayRouteTable.addDependency(cfnTransitGateway)


    const secondaryCfnTransitGatewayRouteTableAssociation = new ec2.CfnTransitGatewayRouteTableAssociation(this, 'SecondaryCfnTransitGatewayRouteTableAssociation', {
      transitGatewayAttachmentId: secondaryCfnTransitGatewayAttachment.attrId,
      transitGatewayRouteTableId: cfnTransitGatewayRouteTable.attrTransitGatewayRouteTableId
    })
    secondaryCfnTransitGatewayRouteTableAssociation.addDependency(secondaryCfnTransitGatewayAttachment)
    secondaryCfnTransitGatewayRouteTableAssociation.addDependency(cfnTransitGatewayRouteTable)


    const tertiaryCfnTransitGatewayRouteTableAssociation = new ec2.CfnTransitGatewayRouteTableAssociation(this, 'TertiaryCfnTransitGatewayRouteTableAssociation', {
      transitGatewayAttachmentId: tertiaryCfnTransitGatewayAttachment.attrId,
      transitGatewayRouteTableId: cfnTransitGatewayRouteTable.attrTransitGatewayRouteTableId
    })
    tertiaryCfnTransitGatewayRouteTableAssociation.addDependency(tertiaryCfnTransitGatewayAttachment)
    tertiaryCfnTransitGatewayRouteTableAssociation.addDependency(cfnTransitGatewayRouteTable)



    const primaryCfnTransitGatewayRouteTablePropagation = new ec2.CfnTransitGatewayRouteTablePropagation(this, 'PrimaryCfnTransitGatewayRouteTablePropagation', {
      transitGatewayAttachmentId: primaryCfnTransitGatewayAttachment.attrId,
      transitGatewayRouteTableId: cfnTransitGatewayRouteTable.attrTransitGatewayRouteTableId,
    });
    primaryCfnTransitGatewayRouteTablePropagation.addDependency(primaryCfnTransitGatewayAttachment)
    primaryCfnTransitGatewayRouteTablePropagation.addDependency(cfnTransitGatewayRouteTable)








  }
}