import fetch from "node-fetch";

let totalMonthlySales = 0;
let totalYearlySales = 0;
let totalOverallSales = 0;

const apiURL = "https://vpn.shadownode.org/api/getData";

async function fetchData() {
  try {
    const res = await fetch(apiURL);
    const data = await res.json();
    const packageTypes = data.data.map((entry) => entry.package_type);

    totalMonthlySales = packageTypes.filter(
      (type) => type === "Monthly"
    ).length;
    totalYearlySales = packageTypes.filter((type) => type === "Yearly").length;

    totalOverallSales = totalMonthlySales + totalYearlySales;

    console.log("Total monthly sales:", totalMonthlySales);
    console.log("Total yearly sales:", totalYearlySales);
    console.log("Total overall sales:", totalMonthlySales + totalYearlySales);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

await fetchData();

export { totalMonthlySales, totalYearlySales, totalOverallSales };
