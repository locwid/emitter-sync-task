import { EventBalancer, EventBatch } from "./event-balancer";

/**
 * A manual event balancer. It will execute the first batch that returns the selectFn or the first batch in the queue.
 */
export class EventManualBalancer<
  TName extends string,
> extends EventBalancer<TName> {
  private batches: Map<TName, EventBatch<TName>> = new Map();
  private selectFn: (
    current: EventBatch<TName>,
    next: EventBatch<TName>,
  ) => EventBatch<TName>;

  /**
   * Creates an instance of EventQueueBalancer. If predicate is not provided, all events will be executed in the order they were pushed.
   *
   * @param selectFn - Select first batch to execute that satisfies the predicate.
   */
  constructor(
    callback: (batch: EventBatch<TName>) => void,
    throttleMs: number = 0,
    selectFn: (
      current: EventBatch<TName>,
      next: EventBatch<TName>,
    ) => EventBatch<TName>,
  ) {
    super(callback, throttleMs);
    this.selectFn = selectFn;
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
    const values = Array.from(this.batches.values());

    const [first] = values;
    if (!first) {
      return null;
    }

    const batch = values.reduce(this.selectFn, first);
    this.batches.delete(batch.name);

    return batch;
  }
}
