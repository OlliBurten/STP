const METRICS_KEY = "drivermatch-segment-metrics";

function readState() {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

function writeState(next) {
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(next));
  } catch (_) {}
}

function increment(path, amount = 1) {
  const state = readState();
  const current = Number(state[path] || 0);
  state[path] = current + amount;
  writeState(state);
}

function incrementNested(root, key, amount = 1) {
  const state = readState();
  const currentRoot = state[root] && typeof state[root] === "object" ? state[root] : {};
  const current = Number(currentRoot[key] || 0);
  currentRoot[key] = current + amount;
  state[root] = currentRoot;
  writeState(state);
}

export function trackDriverOnboardingComplete(primarySegment) {
  increment("driverOnboardingCompleted");
  if (primarySegment) incrementNested("driverPrimarySegments", primarySegment);
}

export function trackCompanyOnboardingComplete(defaultSegments = []) {
  increment("companyOnboardingCompleted");
  for (const segment of defaultSegments) {
    if (segment) incrementNested("companyDefaultSegments", segment);
  }
}

export function trackJobPosted(segment) {
  increment("jobsPostedTotal");
  if (segment) incrementNested("jobsPostedBySegment", segment);
}
