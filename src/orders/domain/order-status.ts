/**
 * Kanban stages for an order. Stable backend tokens; the UI maps them to the
 * Spanish column labels. A new contact's order lands in `no_atendido`.
 */
export const ORDER_STATUSES = [
  'no_atendido',
  'contactado',
  'confirmado',
  'sin_interes',
  'entregado',
  'cancelado',
  'otros_servicios',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DEFAULT_ORDER_STATUS: OrderStatus = 'no_atendido';
