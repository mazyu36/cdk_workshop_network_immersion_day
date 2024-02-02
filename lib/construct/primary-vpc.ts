import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

export interface PrimaryVpcConstructProps {

}

export class PrimaryVpcConstruct extends Construct {
  public readonly primaryVpc: ec2.Vpc
  constructor(scope: Construct, id: string, props: PrimaryVpcConstructProps) {
    super(scope, id);

    // ------ Primary VPC -------
    const primaryVpc = new ec2.Vpc(this, 'PrimaryVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnetIsolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    }
    )
    this.primaryVpc = primaryVpc

    const publicInstance = new ec2.Instance(this, 'PublicInstance', {
      vpc: primaryVpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
        cpuType: ec2.AmazonLinuxCpuType.X86_64
      }),
      vpcSubnets: primaryVpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }),
      ssmSessionPermissions: true,
      associatePublicIpAddress: true
    });

    publicInstance.connections.allowFromAnyIpv4(ec2.Port.allIcmp())


    const privateInstance = new ec2.Instance(this, 'PrivateInstance', {
      vpc: primaryVpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
        cpuType: ec2.AmazonLinuxCpuType.X86_64
      }),
      vpcSubnets: primaryVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
      ssmSessionPermissions: true
    });

    privateInstance.connections.allowFromAnyIpv4(ec2.Port.allIcmp())

  }
}