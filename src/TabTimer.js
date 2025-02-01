export class TabTimer {
  constructor() {
    this.tabTimes = new Map(); // Maps tabId -> { startTime, lastNotification, pendingNotifications, lastActiveTime }
    this.INACTIVE_THRESHOLD = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Updated intervals with more detailed messages and correct time values
    this.intervals = [
      {
        time: 0,
        getMessage: (timeSpent) => "Initial visit to this page",
      },
      {
        time: 10 * 1000, // 10 seconds
        getMessage: (timeSpent) =>
          `You've been on this page for ${Math.floor(timeSpent)} seconds`,
      },
      {
        time: 20 * 1000, // 20 seconds
        getMessage: (timeSpent) => `20 seconds have passed on this page`,
      },
      {
        time: 30 * 1000, // 30 seconds
        getMessage: (timeSpent) => `30 seconds on this page - time check!`,
      },
    ];
  }

  startTracking(tabId, domain) {
    const now = Date.now();
    const existingTab = this.tabTimes.get(tabId);

    // Check if tab exists and has been inactive
    if (existingTab) {
      const inactiveTime = now - existingTab.lastActiveTime;
      if (inactiveTime >= this.INACTIVE_THRESHOLD) {
        // Reset the timer but don't show initial notification
        this.tabTimes.set(tabId, {
          startTime: now,
          lastNotification: -1,
          pendingNotifications: [],
          lastActiveTime: now,
          domain,
        });
      } else {
        // Just update the last active time and domain
        existingTab.lastActiveTime = now;
        existingTab.domain = domain;
      }
    } else {
      // New tab tracking
      this.tabTimes.set(tabId, {
        startTime: now,
        lastNotification: -1,
        pendingNotifications: [],
        lastActiveTime: now,
        domain,
      });
    }
  }

  updateLastActiveTime(tabId) {
    const tabInfo = this.tabTimes.get(tabId);
    if (tabInfo) {
      tabInfo.lastActiveTime = Date.now();
    }
  }

  stopTracking(tabId) {
    this.tabTimes.delete(tabId);
  }

  checkTimeAndNotify(activeTabId) {
    const notifications = [];
    const now = Date.now();

    console.log("=== Timer Check ===");
    console.log("Active Tab ID:", activeTabId);
    console.log("All Tabs:", Array.from(this.tabTimes.entries()));

    for (const [tabId, tabInfo] of this.tabTimes.entries()) {
      const inactiveTime = now - tabInfo.lastActiveTime;
      const timeSpent = now - tabInfo.startTime;

      console.log(`\nChecking Tab ${tabId}:`);
      console.log("- Time spent:", Math.floor(timeSpent / 1000), "seconds");
      console.log("- Last notification:", tabInfo.lastNotification);
      console.log("- Is active tab:", tabId === activeTabId);

      if (inactiveTime >= this.INACTIVE_THRESHOLD) {
        console.log("- Tab inactive, skipping");
        continue;
      }

      // Find all intervals that should trigger
      const dueIntervals = this.intervals.filter((interval) => {
        const shouldTrigger =
          interval.time <= timeSpent &&
          (tabInfo.lastNotification === -1 ||
            interval.time > tabInfo.lastNotification);
        return shouldTrigger;
      });

      console.log("- Due intervals:", dueIntervals);

      if (dueIntervals.length > 0 && tabId === activeTabId) {
        const latestInterval = dueIntervals[dueIntervals.length - 1];
        tabInfo.lastNotification = latestInterval.time;
        notifications.push({
          message: latestInterval.getMessage(timeSpent / 1000),
          timeSpent: Math.floor(timeSpent / 1000),
        });
        console.log(
          "- Queued notification:",
          notifications[notifications.length - 1]
        );
      }
    }

    console.log("\nReturning notifications:", notifications);
    return notifications;
  }

  checkPendingNotifications(tabId) {
    const tabInfo = this.tabTimes.get(tabId);
    if (!tabInfo || tabInfo.pendingNotifications.length === 0) return null;

    const now = Date.now();
    const inactiveTime = now - tabInfo.lastActiveTime;

    // If tab was inactive for too long, clear pending notifications without showing them
    if (inactiveTime >= this.INACTIVE_THRESHOLD) {
      tabInfo.pendingNotifications = [];
      return null;
    }

    const latestNotification =
      tabInfo.pendingNotifications[tabInfo.pendingNotifications.length - 1];
    const timeSpent = now - tabInfo.startTime;

    tabInfo.pendingNotifications = [];
    tabInfo.lastNotification = latestNotification.time;
    tabInfo.lastActiveTime = now;

    return {
      message: latestNotification.getMessage(timeSpent / 1000),
      timeSpent: Math.floor(timeSpent / 1000 / 60),
    };
  }
}
