import type { Product, LogEntry } from "./types";

export const products: Product[] = [
  { id: 1, name: "MacBook Pro", price: 2499, stock: 15 },
  { id: 2, name: "iPhone 15", price: 999, stock: 42 },
  { id: 3, name: "AirPods Pro", price: 279, stock: 120 },
  { id: 4, name: "iPad Air", price: 799, stock: 28 },
  { id: 5, name: "Apple Watch", price: 449, stock: 35 },
  { id: 6, name: "Magic Keyboard", price: 349, stock: 67 },
  { id: 7, name: "Studio Display", price: 1799, stock: 8 },
  { id: 8, name: "Mac Mini", price: 699, stock: 22 },
];

export const logs: LogEntry[] = [
  {
    timestamp: "2024-01-15 10:30:00",
    level: "info",
    message: "Application started",
  },
  {
    timestamp: "2024-01-15 10:30:05",
    level: "info",
    message: "Database connected",
  },
  {
    timestamp: "2024-01-15 10:31:12",
    level: "warn",
    message: "Slow query detected (>500ms)",
  },
  {
    timestamp: "2024-01-15 10:32:00",
    level: "error",
    message: "Failed to fetch user #42",
  },
  { timestamp: "2024-01-15 10:33:15", level: "info", message: "Cache cleared" },
  {
    timestamp: "2024-01-15 10:34:22",
    level: "warn",
    message: "Memory usage above 80%",
  },
  {
    timestamp: "2024-01-15 10:35:00",
    level: "error",
    message: "Connection timeout to API",
  },
  {
    timestamp: "2024-01-15 10:36:10",
    level: "info",
    message: "Backup completed",
  },
];
