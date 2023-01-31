import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy("MockVRFV2Wrapper", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};
export default func;
func.tags = ["MockVRFV2Wrapper"];
