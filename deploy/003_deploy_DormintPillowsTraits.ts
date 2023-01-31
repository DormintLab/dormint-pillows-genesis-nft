
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  const mockToken = await ethers.getContract('MockLinkToken')
  const mockVRFWrapper = await ethers.getContract('MockVRFV2Wrapper')
  await deploy("DormintPillowsTraits", {
    from: deployer,
    proxy: {
      owner: deployer,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [mockToken.address, mockVRFWrapper.address],
        },
      },
    },
    args: [],
    log: true,
    autoMine: true,
  });
};
export default func;
func.tags = ["DormintPillowsTraits"];
func.dependencies = ["MockLinkToken", "MockVRFV2Wrapper"];
