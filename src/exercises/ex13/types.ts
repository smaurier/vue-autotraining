export interface ColumnDef<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  formatter?: (value: T[keyof T], row: T) => string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}
