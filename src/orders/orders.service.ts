import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { Order } from './domain/order';
import { DEFAULT_ORDER_STATUS, OrderStatus } from './domain/order-status';

@Injectable()
export class OrdersService {
  constructor(private readonly orderRepository: OrderRepository) {}

  /**
   * Idempotent: creates the contact's order in the first kanban stage if it has
   * none, else returns the existing one. Called when a contact is created (both
   * the ingest and manual paths), so every contact becomes a kanban card.
   */
  async ensureForContact(brandId: number, contactId: string): Promise<Order> {
    const existing = await this.orderRepository.findByContact(contactId);
    if (existing) return existing;
    return this.orderRepository.create({
      brandId,
      contactId,
      status: DEFAULT_ORDER_STATUS,
      total: 0,
      currency: 'USD',
      notes: null,
    });
  }

  /** All orders of a brand — grouped by status in the kanban UI. */
  listForBrand(brandId: number): Promise<Order[]> {
    return this.orderRepository.findByBrand(brandId);
  }

  /** A single brand-owned order (404 if not the brand's). */
  async getForBrand(brandId: number, id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order || order.brandId !== brandId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  /** The order of a contact, brand-scoped (null when none). */
  async getForContact(
    brandId: number,
    contactId: string,
  ): Promise<Order | null> {
    const order = await this.orderRepository.findByContact(contactId);
    return order && order.brandId === brandId ? order : null;
  }

  /** Edits an order (move stage / total / notes), brand-scoped. */
  async updateForBrand(
    brandId: number,
    id: string,
    patch: { status?: OrderStatus; total?: number; notes?: string | null },
  ): Promise<Order> {
    await this.getForBrand(brandId, id);
    const updated = await this.orderRepository.update(id, {
      status: patch.status,
      total: patch.total,
      notes: patch.notes,
    });
    if (!updated) throw new NotFoundException('Order not found');
    return updated;
  }
}
