// Products at or below this stock level are shown with a "low" badge.
// (Display-only; the backend dashboard is the source of truth for counts.)
export const LOW_STOCK_THRESHOLD = 10;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMPTY_PRODUCT = { name: "", sku: "", price: "", quantity: "" };
export const EMPTY_CUSTOMER = { full_name: "", email: "", phone: "" };
export const DEFAULT_ORDER_LINE = { product_id: "", quantity: "1" };

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Order statuses and their Badge tones (see UI/Badge.jsx).
export const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];
export const ORDER_STATUS_TONE = {
  Pending: "amber",
  Processing: "blue",
  Shipped: "indigo",
  Delivered: "green",
  Cancelled: "slate",
};

export const MESSAGES = {
  loading: "Loading…",
  noProducts: "No products yet. Add your first product.",
  noCustomers: "No customers yet. Add your first customer.",
  noOrders: "No orders yet.",
  wellStocked: "All products are well stocked. 🎉",
  productCreated: "Product created",
  productUpdated: "Product updated",
  productDeleted: "Product deleted",
  customerCreated: "Customer created",
  customerDeleted: "Customer deleted",
  orderCreated: "Order created",
  orderCancelled: "Order cancelled",
};
