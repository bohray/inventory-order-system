const ENDPOINTS = {
  products: "/products",
  product: (id) => `/products/${id}`,

  customers: "/customers",
  customer: (id) => `/customers/${id}`,

  orders: "/orders",
  order: (id) => `/orders/${id}`,

  dashboardSummary: "/dashboard/summary",
};

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

function qs(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries).toString();
}

async function request(path, { method = "GET", body } = {}) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new Error(extractError(data) || `Request failed (${res.status})`);
  }
  return data;
}

// FastAPI returns errors as {detail: ...}; detail can be a string or a list
// of validation errors. Normalize both into a readable message.
function extractError(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  const detail = data.detail;
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => {
        const field = Array.isArray(e.loc) ? e.loc.slice(1).join(".") : "";
        return field ? `${field}: ${e.msg}` : e.msg;
      })
      .join("; ");
  }
  return JSON.stringify(detail);
}

// Page through every record of a paginated endpoint and return the flat list.
// Used for form dropdowns that must show all options, not a single page.
async function fetchAll(listFn) {
  const first = await listFn({ page: 1, pageSize: 100 });
  let items = [...first.items];
  for (let page = 2; page <= first.pages; page++) {
    const next = await listFn({ page, pageSize: 100 });
    items = items.concat(next.items);
  }
  return items;
}

export const api = {
  listProducts: ({ page = 1, pageSize = 10 } = {}) =>
    request(`${ENDPOINTS.products}${qs({ page, page_size: pageSize })}`),
  listAllProducts: () => fetchAll(api.listProducts),
  getProduct: (id) => request(ENDPOINTS.product(id)),
  createProduct: (body) =>
    request(ENDPOINTS.products, { method: "POST", body }),
  updateProduct: (id, body) =>
    request(ENDPOINTS.product(id), { method: "PUT", body }),
  deleteProduct: (id) => request(ENDPOINTS.product(id), { method: "DELETE" }),

  listCustomers: ({ page = 1, pageSize = 10 } = {}) =>
    request(`${ENDPOINTS.customers}${qs({ page, page_size: pageSize })}`),
  listAllCustomers: () => fetchAll(api.listCustomers),
  getCustomer: (id) => request(ENDPOINTS.customer(id)),
  createCustomer: (body) =>
    request(ENDPOINTS.customers, { method: "POST", body }),
  deleteCustomer: (id) => request(ENDPOINTS.customer(id), { method: "DELETE" }),

  listOrders: ({ page = 1, pageSize = 10 } = {}) =>
    request(`${ENDPOINTS.orders}${qs({ page, page_size: pageSize })}`),
  getOrder: (id) => request(ENDPOINTS.order(id)),
  createOrder: (body) => request(ENDPOINTS.orders, { method: "POST", body }),
  deleteOrder: (id) => request(ENDPOINTS.order(id), { method: "DELETE" }),

  getDashboard: () => request(ENDPOINTS.dashboardSummary),
};
