import { EventBalancer, EventBatch } from "./event-balancer";

/**
 * A queue-based event balancer (aka first-in, first-out).
 */
export class EventQueueBalancer<
  TName extends string,
> extends EventBalancer<TName> {
  private batches: Map<TName, EventBatch<TName>> = new Map();

  public addBatch(eventName: TName, value: number): void {
    const existing = this.batches.get(eventName);
    if (existing) {
      existing.batch(value);
      return;
    }

    this.batches.set(eventName, new EventBatch(eventName, value));
  }

  protected getNextBatch(): EventBatch<TName> | null {
    const [batch = null] = this.batches.values();
    if (batch) this.batches.delete(batch.name);

    return batch;
  }
}
