// Layer: ts/ui/orders-controller — modal "Mis compras" (historial del usuario logueado).
import { mine } from "../data/order-repository.js";
import { formatPrice } from "../domain/models.js";
import { getSession } from "../services/session-store.js";

interface OrdersDeps {
  requireAuth: (notice: string) => void;
}

export function setupOrders(deps: OrdersDeps): {
  openOrders: () => void;
} {
  const backdrop = getEl("ordersBackdrop");
  const list = getEl("ordersList");
  const empty = getEl("ordersEmpty");
  const error = getEl("ordersError");

  function closeOrders(): void {
    backdrop.classList.remove("open");
    document.body.classList.remove("modal-open");
  }

  async function openOrders(): Promise<void> {
    const session = getSession();
    // Why: el historial es por usuario; sin JWT el backend responde 401.
    if (!session) {
      deps.requireAuth("Entra con tu cuenta para ver tu historial de compras.");
      return;
    }
    error.textContent = "";
    list.innerHTML = "";
    empty.style.display = "none";
    backdrop.classList.add("open");
    document.body.classList.add("modal-open");

    try {
      const orders = await mine();
      empty.style.display = orders.length === 0 ? "block" : "none";
      for (const o of orders) {
        const card = document.createElement("div");
        card.className = "order";
        const date = o.createdAtUtc
          ? new Date(o.createdAtUtc).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" })
          : "";
        const lines = o.items
          .map((i) => `${i.quantity} × ${i.productName} — ${formatPrice(i.unitPrice * i.quantity)}`)
          .join("\n");
        card.innerHTML = `<div class="order-head"><strong></strong><span class="order-date"></span></div><div class="order-items"></div><div class="order-total"><span>Total</span><strong></strong></div>`;
        (card.querySelector(".order-head strong") as HTMLElement).textContent = `Pedido #${o.id.slice(0, 8)}`;
        (card.querySelector(".order-date") as HTMLElement).textContent = date;
        (card.querySelector(".order-items") as HTMLElement).textContent = lines;
        (card.querySelector(".order-total strong") as HTMLElement).textContent = formatPrice(o.total);
        list.appendChild(card);
      }
    } catch (e) {
      if (e instanceof Error && e.message === "NO_AUTH") {
        closeOrders();
        deps.requireAuth("Tu sesión venció. Entra de nuevo para ver tus compras.");
      } else {
        error.textContent = e instanceof Error ? e.message : "No se pudo cargar el historial.";
      }
    }
  }

  getEl("ordersBtn").addEventListener("click", () => void openOrders());
  getEl("closeOrdersBtn").addEventListener("click", closeOrders);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeOrders();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && backdrop.classList.contains("open")) closeOrders();
  });

  return { openOrders };
}

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Falta #${id} en index.html`);
  return el;
}
