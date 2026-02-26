export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CartItem {
  product: ProductInfo;
  quantity: number;
}

export interface ProductInfo {
  id: number;
  name: string;
  price: number;
}

export interface Notification {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  timestamp: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
