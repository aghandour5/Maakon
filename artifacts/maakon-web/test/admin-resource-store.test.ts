import test from "node:test";
import assert from "node:assert/strict";
import {
  AdminResource,
  oncePerSession,
  refreshResources,
} from "../src/components/admin/adminResourceStore";
function deferred<T>() {
  let resolve!: (x: T) => void, reject!: (e: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { resolve, reject, promise };
}

test("switches reuse requests and cached rows, and isolate a late NGO failure", async () => {
  let requests = 0,
    time = 100;
  const next = deferred<string[]>(),
    fault = deferred<string[]>();
  const posts = new AdminResource(
    () => (++requests === 1 ? Promise.resolve(["first"]) : next.promise),
    () => time,
  );
  const ngos = new AdminResource(() => fault.promise);
  const load = posts.load();
  assert.equal(load, posts.load());
  await load;
  const failure = assert.rejects(ngos.load(), /NGO unavailable/);
  await posts.load();
  assert.equal(requests, 1);
  fault.reject(Error("NGO unavailable"));
  await failure;
  assert.equal(posts.snapshot().error, null);
  assert.match(ngos.snapshot().error!.message, /NGO/);
  time += 30_001;
  const refresh = posts.load();
  assert.equal(posts.snapshot().refreshing, true);
  assert.deepEqual(posts.snapshot().data, ["first"]);
  next.resolve(["new"]);
  await refresh;
  assert.equal(requests, 2);
  assert.deepEqual(posts.snapshot().data, ["new"]);
});
test("a superseded fetch cannot overwrite a newer response or clear its spinner", async () => {
  const first = deferred<string>(),
    second = deferred<string>();
  let n = 0;
  const resource = new AdminResource(() =>
    ++n === 1 ? first.promise : second.promise,
  );
  const stale = resource.load();
  resource.invalidate();
  const fresh = resource.load();
  first.resolve("old");
  await stale;
  assert.equal(resource.snapshot().loading, true);
  second.resolve("new");
  await fresh;
  assert.equal(resource.snapshot().data, "new");
});
test("refresh waits for all resources and identifies individual failures", async () => {
  const first = deferred<number>(),
    second = deferred<number>();
  let finished = false;
  const refresh = refreshResources({
    stats: new AdminResource(() => first.promise),
    reports: new AdminResource(() => second.promise),
  }).then((errors) => {
    finished = true;
    return errors;
  });
  first.reject(Error("unavailable"));
  await new Promise((r) => setImmediate(r));
  assert.equal(finished, false);
  second.resolve(7);
  assert.deepEqual(await refresh, ["stats: unavailable"]);
});
test("session gate escalates once across tabs and stats", () => {
  const events: string[] = [];
  const report = oncePerSession((e: string) => events.push(e));
  report("mfa");
  report("mfa");
  report("auth");
  assert.deepEqual(events, ["mfa"]);
});
