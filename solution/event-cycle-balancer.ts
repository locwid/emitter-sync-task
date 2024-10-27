import { EventBalancer, EventBatch } from "./event-balancer";

/**
 * A cycle-based event balancer (aka round-robin).
 */
export class EventCycleBalancer<
  TName extends string,
> extends EventBalancer<TName> {
  protected cycle: TName[] = [];
  private cursor: number = 0;
  private batches: Map<TName, EventBatch<TName>> = new Map();

  /**
   * Creates an instance of EventCycleBalancer. If orders are not provided, takes the first batch in the queue.
   *
   * @param orders - The order of events to be executed
   */
  constructor(
    callback: (batch: EventBatch<TName>) => void,
    throttleMs: number = 0,
    cycle: TName[] = [],
  ) {
    super(callback, throttleMs);
    this.cycle = cycle;
  }

  protected addBatch(eventName: TName, value: number): void {
    const existing = this.batches.get(eventName);
    if (existing) {
      existing.batch(value);
      return;
    }

    this.batches.set(eventName, new EventBatch(eventName, value));
  }

  protected getNextBatch(): EventBatch<TName> | null {
    const start = this.cursor;
    let batch: EventBatch<TName> | null = null;

    do {
      this.updateCursor();
      const eventName = this.cycle[this.cursor];
      if (eventName) {
        batch = this.batches.get(eventName) || null;
      }
    } while (this.cursor !== start && !batch);

    if (!batch) {
      [batch = null] = this.batches.values();
    }

    if (batch) {
      this.batches.delete(batch.name);
    }

    return batch;
  }

  private updateCursor(): void {
    this.cursor = this.cursor === this.cycle.length - 1 ? 0 : this.cursor + 1;
  }
}
