export interface DeliveryWarning {
  /** 1-based line number in the delivery file. */
  line: number;
  item: string;
  message: string;
}

interface ValidQuantity {
  ok: true;
  value: number;
}

interface InvalidQuantity {
  ok: false;
  message: string;
}

export type QuantityResult = ValidQuantity | InvalidQuantity;
