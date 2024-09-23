const { network, ethers } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat.confg");
const { verify } = require("../utils/Verification");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  log("-------------------------------------------------");
  log("Deploying Id_generator...");

  const { totalMonthlySales, totalYearlySales, totalOverallSales } =
    await import("../utils/fetchDataFromApi.mjs");

  console.log();

  const constructorArgs = [
    networkConfig[chainId].usdt,
    "10",
    "20",
    totalYearlySales,
    totalMonthlySales,
    totalOverallSales,
  ];

  const rental = await deploy("VPNIDGenerator", {
    from: deployer,
    log: true,
    args: constructorArgs,
    waitConfirmations: network.config.blockConfirmations || 1,
    gasLimit: 6000000,
  });

  if (!developmentChains.includes(network.name)) {
    await verify(rental.address, constructorArgs);
  }
  log("-------------------------------------------------");
  log("successfully deployed ID_generator...");
};

module.exports.tags = ["all", "Id_generator"];
