export const SAMPLE_DELIVERY = [
  "banana=50",
  "fish=100",
  "hay=200",
  "meat=75",
  "lettuce=",
  'carrots="20"',
].join("\n");

export const SAMPLE_USAGE = [
  "food,quantity",
  "banana,8",
  "fish,25",
  "banana,12",
  "hay,50",
  "meat,20",
  "fish,30",
  "banana,5",
  "hay,45",
  "meat,18",
  "fish,40",
  "carrots,5",
  "carrots,8",
].join("\n");

export const SAMPLE_INVENTORY = JSON.stringify([
  { item: "banana", quantity: 18 },
  { item: "fish", quantity: 5 },
  { item: "hay", quantity: 105 },
  { item: "meat", quantity: 37 },
  { item: "carrots", quantity: 7 },
  { item: "lettuce", quantity: 0 },
]);
