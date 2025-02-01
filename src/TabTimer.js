export class TabTimer {
  constructor() {
    this.tabTimes = new Map(); // Maps tabId -> { startTime, lastNotification }
    this.intervals = [
      { time: 0, message: "Initial visit notification" },
      { time: 15 * 60 * 1000, message: "You've been here for 15 minutes" },
      { time: 30 * 60 * 1000, message: "You've been here for 30 minutes" },
      { time: 60 * 60 * 1000, message: "You've been here for 1 hour" },
    ];
  }

  startTracking(tabId, domain) {
    if (!this.tabTimes.has(tabId)) {
      this.tabTimes.set(tabId, {
        startTime: Date.now(),
        lastNotification: -1,
        domain,
      });
    }
  }

  stopTracking(tabId) {
    this.tabTimes.delete(tabId);
  }

  checkTimeAndNotify(tabId) {
    const tabInfo = this.tabTimes.get(tabId);
    if (!tabInfo) return null;

    const timeSpent = Date.now() - tabInfo.startTime;

    // Find the next notification interval that we haven't shown yet
    const nextInterval = this.intervals.find(
      (interval) =>
        interval.time <= timeSpent && interval.time > tabInfo.lastNotification
    );

    if (nextInterval) {
      tabInfo.lastNotification = nextInterval.time;
      return {
        message: nextInterval.message,
        timeSpent: Math.floor(timeSpent / 1000 / 60), // Convert to minutes
      };
    }

    return null;
  }
}
