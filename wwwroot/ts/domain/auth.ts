// Layer: ts/domain/auth — sesión (access corto + refresh rotativo) y carrito.
export interface Session {
  accessToken: string;
  refreshToken: string;
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
