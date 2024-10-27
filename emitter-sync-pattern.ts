/* Check the comments first */

import { EventEmitter } from "./emitter";
import {
  EventDelayedRepository,
  EventRepositoryError,
} from "./event-repository";
import { EventStatistics } from "./event-statistics";
import { ResultsTester } from "./results-tester";
import { triggerRandomly } from "./utils";
import { EventBalancer } from "./solution/event-balancer";
import { EventQueueBalancer } from "./solution/event-queue-balancer";

const MAX_EVENTS = 1000;

enum EventName {
  EventA = "A",
  EventB = "B",
}

const EVENT_NAMES = [EventName.EventA, EventName.EventB];

/*

  An initial configuration for this case

*/

function init() {
  const emitter = new EventEmitter<EventName>();

  triggerRandomly(() => emitter.emit(EventName.EventA), MAX_EVENTS);
  triggerRandomly(() => emitter.emit(EventName.EventB), MAX_EVENTS);

  const repository = new EventRepository();
  const handler = new EventHandler(emitter, repository);

  const resultsTester = new ResultsTester({
    eventNames: EVENT_NAMES,
    emitter,
    handler,
    repository,
  });
  resultsTester.showStats(20);
}

/* Please do not change the code above this line */
/* ----–––––––––––––––––––––––––––––––––––––---- */

/*

  The implementation of EventHandler and EventRepository is up to you.
  Main idea is to subscribe to EventEmitter, save it in local stats
  along with syncing with EventRepository.

*/

/**
 * Time to throttle the events.
 * If set to 0, it will execute the events as soon as possible and spam the repository.
 * If set to closer to repository rate limit, it will execute the events in a more controlled way.
 */
const THROTTLE_TIME = 300

class EventHandler extends EventStatistics<EventName> {
  // Feel free to edit this class

  repository: EventRepository;
  private emitter: EventEmitter<EventName>;
  private balancer: EventBalancer<EventName>;

  constructor(emitter: EventEmitter<EventName>, repository: EventRepository) {
    super();
    this.repository = repository;
    this.emitter = emitter;

    // 1. EventQueueBalancer implementation
    this.balancer = new EventQueueBalancer(({ name, value }) => {
      this.handle(name, value);
    }, THROTTLE_TIME);

    // // 2. EventCycleBalancer implementation
    // this.balancer = new EventCycleBalancer(
    //   ({ name, value }) => {
    //     this.handle(name, value);
    //   },
    //   THROTTLE_TIME,
    //   [EventName.EventA, EventName.EventB],
    // );

    // // 3. EventManualBalancer implementation
    // this.balancer = new EventManualBalancer(
    //   ({ name, value }) => {
    //     this.handle(name, value);
    //   },
    //   THROTTLE_TIME,
    //   // Select the batch with the maximum value
    //   (current, next) => {
    //     return next.value > current.value ? next : current;
    //   },
    // );

    this.register(EventName.EventA);
    this.register(EventName.EventB);
  }

  private register(eventName: EventName) {
    this.emitter.subscribe(eventName, async () => {
      this.addStats(eventName, 1);
      this.balancer.push(eventName, 1);
    });
  }

  private async handle(eventName: EventName, value: number) {
    const error = await this.repository.saveEventData(eventName, value);

    if (!error) return;

    if (
      [
        EventRepositoryError.TOO_MANY,
        EventRepositoryError.REQUEST_FAIL,
      ].includes(error)
    ) {
      this.balancer.push(eventName, value);
    }
  }

  private addStats(eventName: EventName, value: number) {
    this.setStats(eventName, (this.getStats(eventName) || 0) + value);
  }
}

class EventRepository extends EventDelayedRepository<EventName> {
  // Feel free to edit this class

  async saveEventData(
    eventName: EventName,
    value: number,
  ): Promise<EventRepositoryError | null> {
    try {
      await this.updateEventStatsBy(eventName, value);
      return null;
    } catch (e) {
      return e as EventRepositoryError;
    }
  }
}

init();
