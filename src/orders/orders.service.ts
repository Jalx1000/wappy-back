import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { Order } from './domain/order';
import { OrderItem } from './domain/order-item';
import { DEFAULT_ORDER_STATUS, OrderStatus } from './domain/order-status';

@Injectable()
export class OrdersService {
  constructor(private readonly orderRepository: OrderRepository) {}

  /**
   * Idempotent per contact: creates the contact's "lead" order in the first
   * kanban stage if it has none, else returns the existing lead. A contact may
   * also have purchase orders (source=woocommerce); this only owns the lead, so
   * inbound messages never spawn a second empty card.
   */
  async ensureForContact(brandId: number, contactId: string): Promise<Order> {
    const existing = await this.orderRepository.findLeadByContact(contactId);
    if (existing) return existing;
    return this.orderRepository.create({
      brandId,
      contactId,
      source: 'lead',
      status: DEFAULT_ORDER_STATUS,
      total: 0,
      currency: 'USD',
      items: null,
      externalId: null,
      orderNumber: null,
      notes: null,
    });
  }

  /**
   * Registers an order coming from an external store (WooCommerce) with its line
   * items and real total. Idempotent by externalId: a retried checkout returns
   * the stored order instead of creating a duplicate.
   */
  async createFromExternal(
    brandId: number,
    contactId: string,
    dto: {
      externalId: string;
      orderNumber?: string | null;
      currency?: string;
      total?: number;
      items?: OrderItem[] | null;
      status?: OrderStatus;
    },
  ): Promise<Order> {
    const existing = await this.orderRepository.findByExternalId(
      brandId,
      dto.externalId,
    );
    if (existing) return existing;
    return this.orderRepository.create({
      brandId,
      contactId,
      source: 'woocommerce',
      externalId: dto.externalId,
      orderNumber: dto.orderNumber ?? null,
      currency: dto.currency ?? 'USD',
      total: dto.total ?? 0,
      items: dto.items ?? null,
      status: dto.status ?? DEFAULT_ORDER_STATUS,
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

  /** The lead order of a contact, brand-scoped (null when none). */
  async getForContact(
    brandId: number,
    contactId: string,
  ): Promise<Order | null> {
    const order = await this.orderRepository.findByContact(contactId);
    return order && order.brandId === brandId ? order : null;
  }

  /** All brand-owned orders of a contact (N per contact). */
  async findManyForContact(
    brandId: number,
    contactId: string,
  ): Promise<Order[]> {
    const orders = await this.orderRepository.findManyByContact(contactId);
    return orders.filter((o) => o.brandId === brandId);
  }

  /** How many orders a contact has — powers the delete-contact warning. */
  countForContact(contactId: string): Promise<number> {
    return this.orderRepository.countByContact(contactId);
  }

  /** The contact's most recent order (findManyForContact is createdAt DESC). */
  async getLatestForContact(
    brandId: number,
    contactId: string,
  ): Promise<Order | null> {
    const orders = await this.findManyForContact(brandId, contactId);
    return orders[0] ?? null;
  }

  /** Edits an order (move stage / total / notes / line items), brand-scoped. */
  async updateForBrand(
    brandId: number,
    id: string,
    patch: {
      status?: OrderStatus;
      total?: number;
      notes?: string | null;
      items?: OrderItem[] | null;
    },
  ): Promise<Order> {
    await this.getForBrand(brandId, id);
    const updated = await this.orderRepository.update(id, {
      status: patch.status,
      total: patch.total,
      notes: patch.notes,
      items: patch.items,
    });
    if (!updated) throw new NotFoundException('Order not found');
    return updated;
  }

  /** Deletes a single brand-owned order (404 if not the brand's). */
  async removeForBrand(brandId: number, id: string): Promise<void> {
    await this.getForBrand(brandId, id);
    await this.orderRepository.remove(id);
  }

  /**
   * Cascade: deletes every brand-owned order of a contact and returns how many.
   * Called when the contact itself is deleted (S5).
   */
  async removeForContact(brandId: number, contactId: string): Promise<number> {
    const orders = await this.findManyForContact(brandId, contactId);
    for (const order of orders) {
      await this.orderRepository.remove(order.id);
    }
    return orders.length;
  }
}
