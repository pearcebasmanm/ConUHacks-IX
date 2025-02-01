export class TabTimer {
  constructor() {
    this.tabTimes = new Map(); // Maps tabId -> { startTime, lastNotification, pendingNotifications, lastActiveTime }
    this.INACTIVE_THRESHOLD = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Updated intervals with more detailed messages
    this.intervals = [
      {
        time: 0,
        getMessage: (timeSpent) => "You just started browsing this page",
      },
      {
        time: 15 * 60 * 1000,
        getMessage: (timeSpent) =>
          `You've spent ${Math.floor(
            timeSpent / 60
          )} minutes here. Taking a short break might help maintain focus.`,
      },
      {
        time: 30 * 60 * 1000,
        getMessage: (timeSpent) =>
          `30 minutes have passed. Consider if this aligns with your focus goals.`,
      },
      {
        time: 60 * 60 * 1000,
        getMessage: (timeSpent) =>
          `You've been here for an hour. Time for a proper break?`,
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
          lastNotification: 0, // Skip initial notification
          pendingNotifications: [],
          lastActiveTime: now,
          domain,
        });
      } else {
        // Just update the last active time
        existingTab.lastActiveTime = now;
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

    // Check all tabs
    for (const [tabId, tabInfo] of this.tabTimes.entries()) {
      // Check for inactivity
      const inactiveTime = now - tabInfo.lastActiveTime;
      if (inactiveTime >= this.INACTIVE_THRESHOLD) {
        continue; // Skip notifications for inactive tabs
      }

      const timeSpent = now - tabInfo.startTime;

      // Find all intervals that should have triggered
      const dueIntervals = this.intervals.filter(
        (interval) =>
          interval.time <= timeSpent && interval.time > tabInfo.lastNotification
      );

      if (dueIntervals.length > 0) {
        if (tabId === activeTabId) {
          const latestInterval = dueIntervals[dueIntervals.length - 1];
          tabInfo.lastNotification = latestInterval.time;
          notifications.push({
            message: latestInterval.getMessage(timeSpent / 1000), // Convert to seconds for message
            timeSpent: Math.floor(timeSpent / 1000 / 60),
          });
        } else {
          tabInfo.pendingNotifications.push(...dueIntervals);
        }
      }
    }

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
