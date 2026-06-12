/**
 * Kö för analytics-anrop som görs innan PostHog hunnit initieras.
 *
 * Problemet: posthog-js laddas asynkront (dynamic import efter cookie-samtycke).
 * Anrop som sker innan dess — t.ex. `user_registered` direkt efter registrering —
 * blev tidigare no-ops och försvann. Den här kön buffrar anropen och spelar upp
 * dem i ordning när instansen är klar.
 *
 * Ren modul utan beroenden (ingen import.meta) så att logiken kan testas i node.
 */
export function createCallQueue(maxSize = 100) {
  let target = null;
  let queue = [];

  return {
    /** Kör fn(instans) direkt om init är klar, annars läggs anropet i kö. */
    run(fn) {
      if (target) {
        fn(target);
        return;
      }
      if (queue.length < maxSize) queue.push(fn);
    },
    /** Sätt instansen och spela upp alla köade anrop i ursprunglig ordning. */
    flush(instance) {
      target = instance;
      const pending = queue;
      queue = [];
      for (const fn of pending) {
        try {
          fn(instance);
        } catch {
          // Ett trasigt köat anrop ska inte stoppa resten
        }
      }
    },
    get size() {
      return queue.length;
    },
    get isReady() {
      return target != null;
    },
  };
}
