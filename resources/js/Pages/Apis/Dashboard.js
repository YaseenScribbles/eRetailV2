export async function getSalesPersonSummary(fromDate = "", toDate = "") {
  const response = await fetch(`/salespersons?from_date=${fromDate}&to_date=${toDate}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export async function getStockSummary(){
    const response = await fetch('/stock-summary');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}
