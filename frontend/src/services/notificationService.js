import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Call once at app startup (after router is ready).
 * When the user taps a notification, navigate to the route in its extra.route payload.
 */
export function setupNotificationTapHandler(navigate) {
  if (!Capacitor.isNativePlatform()) return;
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const route = action?.notification?.extra?.route;
    if (route) navigate(route);
  });
}

const DAILY_ID   = 1;
const WEEKLY_ID  = 2;

const DAILY_MESSAGES = [
  "Check in and see what your body is ready for today.",
  "Your personalized move is waiting. What does your body need?",
  "Morning! Time to check in — your body has data from last night.",
  "A little movement goes a long way. See today's recommendation →",
  "Check your readiness and let Second Rise pick today's workout.",
];

function randomMessage() {
  return DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)];
}

/**
 * Request permission and schedule:
 *   - Daily 7:00 AM readiness reminder
 *   - Weekly Sunday 8:00 AM progress summary
 *
 * Safe to call on every app launch — cancels and reschedules to avoid duplicates.
 */
export async function setupDailyNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { display } = await LocalNotifications.requestPermissions();
    if (display !== 'granted') {
      console.log('[notifications] Permission not granted — skipping schedule');
      return;
    }

    // Cancel any existing scheduled notifications to avoid duplicates
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          // Daily 7:00 AM — repeats every day
          id: DAILY_ID,
          title: 'Good morning ☀️',
          body: randomMessage(),
          schedule: {
            on: { hour: 7, minute: 0 },
            repeats: true,
            allowWhileIdle: true,
          },
          smallIcon: 'ic_stat_second_rise',
          iconColor: '#4BA3E3',
        },
        {
          // Weekly Sunday 8:00 AM — progress summary → deep links to /history
          id: WEEKLY_ID,
          title: 'Your week in review 📊',
          body: 'See how you moved, recovered, and showed up for yourself this week.',
          schedule: {
            on: { weekday: 1, hour: 8, minute: 0 }, // 1 = Sunday
            repeats: true,
            allowWhileIdle: true,
          },
          smallIcon: 'ic_stat_second_rise',
          iconColor: '#4BA3E3',
          extra: { route: '/history' },
        },
      ],
    });

    console.log('[notifications] Daily 7AM + weekly Sunday reminders scheduled');
  } catch (err) {
    // Never crash the app over a notification failure
    console.warn('[notifications] Failed to schedule:', err);
  }
}

/**
 * Cancel all Second Rise notifications (e.g. when user logs out or opts out).
 */
export async function cancelAllNotifications() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: DAILY_ID }, { id: WEEKLY_ID }],
    });
    console.log('[notifications] All notifications cancelled');
  } catch (err) {
    console.warn('[notifications] Cancel failed:', err);
  }
}
