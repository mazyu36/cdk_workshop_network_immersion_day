import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

export interface AdditionalVpcConstructProps {

}

export class AdditionalVpcConstruct extends Construct {
  public readonly secondaryVpc: ec2.Vpc
  public readonly tertiaryVpc: ec2.Vpc

  constructor(scope: Construct, id: string, props: AdditionalVpcConstructProps) {
    super(scope, id);



    // ------ Secondary VPC -------
    const secondaryVpc = new ec2.Vpc(this, 'SecondaryVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
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
    this.secondaryVpc = secondaryVpc

    const privateInstance = new ec2.Instance(this, 'SecondaryPrivateInstance', {
      vpc: secondaryVpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
        cpuType: ec2.AmazonLinuxCpuType.X86_64
      }),
      vpcSubnets: secondaryVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
      ssmSessionPermissions: true
    });

    privateInstance.connections.allowFromAnyIpv4(ec2.Port.allIcmp())


    // ------ Tertiary VPC -------
    const tertiaryVpc = new ec2.Vpc(this, 'TertiaryVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.2.0.0/16'),
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
    this.tertiaryVpc = tertiaryVpc

    const tertiaryPrivateInstance = new ec2.Instance(this, 'TertiaryPrivateInstance', {
      vpc: tertiaryVpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
        cpuType: ec2.AmazonLinuxCpuType.X86_64
      }),
      vpcSubnets: tertiaryVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
      ssmSessionPermissions: true
    });

    tertiaryPrivateInstance.connections.allowFromAnyIpv4(ec2.Port.allIcmp())



  }
}