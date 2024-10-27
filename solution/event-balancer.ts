import { awaitTimeout } from "../utils";

/**
 * Represents a batch of event.
 */
export class EventBatch<TName extends string> {
  name: TName;
  value: number;

  constructor(name: TName, value: number) {
    this.name = name;
    this.value = value;
  }

  /**
   * Adds a value to the current value.
   */
  batch(value: number): void {
    this.value += value;
  }
}

export type EventBalancerCallback<TName extends string> = (
  batch: EventBatch<TName>,
) => void;

/**
 * Abstract class for balancing events.
 */
export abstract class EventBalancer<TName extends string> {
  private execution: Promise<void> | null;
  private callback: EventBalancerCallback<TName>;
  private throttleMs: number;

  /**
   * Returns a new instance of (implemented) EventBalancer.
   *
   * @param callback The callback to be trigger when a batch is ready and execute function fires
   * @param throttleMs 
   */
  constructor(callback: EventBalancerCallback<TName>, throttleMs: number = 0) {
    this.callback = callback;
    this.throttleMs = throttleMs;
  }

  /**
   * Push a new event to the balancer and trigger the execution.
   */
  public push(eventName: TName, value: number): void {
    this.addBatch(eventName, value);
    this.trigger();
  }

  /**
   * Execute the next batch while getNext() returns a batch and throttle the execution if throttleMs is set.
   */
  private trigger(): void {
    if (this.execution) return;
    this.execution = (async () => {
      while (true) {
        const batch = this.getNextBatch();
        if (!batch) {
          this.execution = null;
          return;
        }

        this.callback(batch);
        await awaitTimeout(this.throttleMs);
      }
    })();
  }

  /**
   * Add a new event to the balancer.
   */
  protected abstract addBatch(eventName: TName, value: number): void;

  /**
   * Get the next batch to be executed.
   */
  protected abstract getNextBatch(): EventBatch<TName> | null;
}
