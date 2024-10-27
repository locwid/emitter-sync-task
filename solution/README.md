# Solution "sync local and remote"

## Concept

Solution is based on **batching events** (just **batch**) and sending them to the repository with a **delay**. Throttling time might be less or equal to repository rate limit.

## Error handling

We will push event to the balancer and execute it again if repository return error. `RESPONSE_FAIL` might be skipped, but in real world it should be handled properly as well.

## EventBalancer

`EventBalancer` is an abstract class that provides execution logic for batching events. It's vere simple realization for concrete case, for more complex cases it should be extended.

### Why

- Cons of DI: we can easily switch between implementations.
- Provides a core logic for batching events and executing them.
- Easy to extend and implement custom logic for batch selection.

### Usage

1. `push` event to the balancer, execution will be triggered automatically.

### SHOLD BE IMPLEMENTED

```ts
  protected abstract addBatch(eventName: TName, value: number): void;
  protected abstract getNextBatch(): EventBatch<TName> | null;
```

### Implementation

There are 3 implementations of `EventBalancer`:

- `EventQueueBalancer` - queue implementation, that will execute batches in the order they were pushed.
- `EventCycleBalancer` - "round-robin" implementation, that will executes batches in provided order. If event missed in order then balancer will take first batch from the queue.
- `EventManualBalancer` - manual implementation, it take first batch that return from provided `selectFn` function. It's allow to implement custom logic for batch selection. For example, we can select batch that has the biggest `value`.
