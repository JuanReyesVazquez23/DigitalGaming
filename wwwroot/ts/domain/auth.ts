// Layer: ts/domain/auth — sesión JWT y líneas del carrito.
export interface Session {
  token: string;
  username: string;
  expiresAtUtc: string;
}

export interface CartLine {
  id: string;
  qty: number;
}

export interface CheckoutLine {
  productId: string;
  quantity: number;
}
