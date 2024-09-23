const { expect, assert } = require("chai");
const { developmentChains, testURI } = require("../helper-hardhat.confg");
const { network, getNamedAccounts, ethers, deployments } = require("hardhat");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("ownership unit tests", () => {
      let idGenerator,
        deployer,
        user,
        userSigner,
        usdt,
        signer,
        routerV2,
        provider;
      beforeEach(async function () {
        signer = await ethers.provider.getSigner();
        deployer = (await getNamedAccounts()).deployer;
        user = (await getNamedAccounts()).user;
        userSigner = await ethers.getSigner(user);
        await deployments.fixture(["all"]);
        provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        idGenerator = await ethers.getContract("VPNIDGenerator", deployer);
        routerV2 = routerV2 = await ethers.getContractAt(
          "UniswapV2Router02",
          "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          signer
        );
        usdt = await ethers.getContractAt(
          "IErc20",
          "0xdac17f958d2ee523a2206206994597c13d831ec7",
          signer
        );
      });
      beforeEach(async () => {
        const amountOutMin = 50000000000n;
        const path = [
          "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", //weth
          "0xdac17f958d2ee523a2206206994597c13d831ec7", //usdt
        ];

        const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
        const transactionResponse = await routerV2.swapExactETHForTokens(
          amountOutMin,
          path,
          deployer,
          deadline,
          {
            value: ethers.parseEther("30"),
          }
        );
        await transactionResponse.wait(1);
        // console.log("Deployer Balance Token", await usdt.balanceOf(deployer));
      });
      describe("getTotalYearly, monthly and overallSales", function () {
        it("Should correctly initialize monthly, yearly and overall sales", async () => {
          const { totalMonthlySales, totalYearlySales, totalOverallSales } =
            await import("../utils/fetchDataFromApi.mjs");

          const totalYearlySalesT = await idGenerator.getTotalYearlySales();
          const totalMonthlySalesT = await idGenerator.getTotalMonthlySales();
          const getOverallSalesT = await idGenerator.getOverallSales();

          assert.equal(totalMonthlySalesT, totalMonthlySales);
          assert.equal(totalYearlySales, totalYearlySalesT);
          assert.equal(totalOverallSales, getOverallSalesT);
        });
      });
      describe("payForUniqueIDMonthly", function () {
        it("Should send the tokens to contract", async () => {
          const depBalanceBefore = await usdt.balanceOf(deployer);
          await usdt.approve(idGenerator.target, depBalanceBefore);
          const tx = await idGenerator.payForUniqueIDMonthly();
          await tx.wait(1);
          const contractBal = await usdt.balanceOf(idGenerator);
          expect(contractBal).to.be.greaterThan(0);
        });
        it("Should return the user info", async () => {
          await usdt.approve(
            idGenerator.target,
            await usdt.balanceOf(deployer)
          );
          const tx = await idGenerator.payForUniqueIDMonthly();
          await tx.wait(1);

          const userInfo = await idGenerator.getUserInfo(deployer);
          assert.equal(userInfo[0][0], deployer);
        });
        it("Should increment total yearly sales", async () => {
          const { totalYearlySales } = await import(
            "../utils/fetchDataFromApi.mjs"
          );

          await usdt.approve(
            idGenerator.target,
            await usdt.balanceOf(deployer)
          );
          const tx = await idGenerator.payForUniqueIDYearly();
          await tx.wait(1);

          const totalYearlySalesT = await idGenerator.getTotalYearlySales();
          expect(totalYearlySalesT).to.be.greaterThan(totalYearlySales);
        });
        it("Should return the overall sales", async () => {
          const { totalOverallSales } = await import(
            "../utils/fetchDataFromApi.mjs"
          );
          await usdt.approve(
            idGenerator.target,
            await usdt.balanceOf(deployer)
          );
          const tx = await idGenerator.payForUniqueIDYearly();
          await tx.wait(1);
          const tx2 = await idGenerator.payForUniqueIDMonthly();
          await tx2.wait(1);

          const totalOverallSalesT = await idGenerator.getOverallSales();
          expect(totalOverallSalesT).to.be.greaterThan(totalOverallSales);
        });
        it("Should increment the total monthly sales value", async () => {
          const totalYearlySalesVal =
            await idGenerator.getTotalYearlySalesValue();
          const totalMonthlySalesVal =
            await idGenerator.getTotalMonthlySalesValue();
          const totalOverallSalesVal =
            await idGenerator.getTotalOverallSalesValue();
          await usdt.approve(
            idGenerator.target,
            await usdt.balanceOf(deployer)
          );
          const tx = await idGenerator.payForUniqueIDYearly();
          await tx.wait(1);
          const tx2 = await idGenerator.payForUniqueIDMonthly();
          await tx2.wait(1);

          const totalYealSalesValAfter =
            await idGenerator.getTotalYearlySalesValue();
          const totalMonthlySalesValAfter =
            await idGenerator.getTotalMonthlySalesValue();
          const totalOverallSalesValAfter =
            await idGenerator.getTotalOverallSalesValue();

          console.log(
            "Sales Values: ",
            totalYealSalesValAfter,
            totalMonthlySalesValAfter,
            totalOverallSalesValAfter
          );

          expect(totalYealSalesValAfter).to.be.greaterThan(totalYearlySalesVal);
          expect(totalMonthlySalesValAfter).to.be.greaterThan(
            totalMonthlySalesVal
          );
          expect(totalOverallSalesValAfter).to.be.greaterThan(
            totalOverallSalesVal
          );
        });
      });
    });
