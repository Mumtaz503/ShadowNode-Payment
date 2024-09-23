import fetch from "node-fetch";

let base64Array;

function toBase64(str) {
  return Buffer.from(str).toString("base64");
}

function convertObjToBase64(dataObj) {
  const jsonStr = JSON.stringify(dataObj);

  return toBase64(jsonStr);
}

const apiURL = "https://vpn.shadownode.org/api/getData";

fetch(apiURL)
  .then((res) => res.json())
  .then(async (data) => {
    base64Array = data.data.map((entry) => convertObjToBase64(entry));
    console.log("Got the array");

    for (const item of base64Array.slice(0, 10)) {
      try {
        const tx = await contract.importData(item);
        console.log(`Transaction sent for ${item}: ${tx.hash}`);

        await tx.wait(1);
        console.log(`Transaction confirmed for ${item}`);
      } catch (error) {
        console.error(`Error importing data for ${item}:`, error);
      }
    }
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
