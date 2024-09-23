import fetch from "node-fetch";
import pkg from "hardhat";
const { ethers } = pkg;
const { getNamedAccounts, deployments } = pkg;

const abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_base64EncodedDataFromDB",
        type: "string",
      },
    ],
    name: "importData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const apiURL = "https://vpn.shadownode.org/api/getData";

async function main() {
  let base64Array;

  function toBase64(str) {
    return Buffer.from(str).toString("base64");
  }

  function convertObjToBase64(dataObj) {
    const jsonStr = JSON.stringify(dataObj);
    return toBase64(jsonStr);
  }

  try {
    const res = await fetch(apiURL);
    const data = await res.json();
    base64Array = data.data.map((entry) => convertObjToBase64(entry));

    const contract = await deployments.get("VPNIDGenerator");
    console.log(contract);

    // Loop through base64Array and call importData if needed
    for (const item of base64Array) {
      const tx = await vpnIdGenerator.importData(item);
      console.log(`Transaction sent for ${item}: ${tx.hash}`);

      await tx.wait();
      console.log(`Transaction confirmed for ${item}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
