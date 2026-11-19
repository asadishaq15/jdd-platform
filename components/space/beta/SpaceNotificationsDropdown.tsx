"use client";

import { useMemo, useState } from "react";
import {
  JOURNEY_DEMO_NOTIFICATIONS,
  JOURNEY_DEMO_WORLDS,
  type JourneyNotification,
  type JourneyWorld,
} from "../../../lib/my-journey-demo";

function cloneDemo() {
  return {
    worlds: JOURNEY_DEMO_WORLDS.map((world) => ({
      ...world,
      actions: world.actions.map((action) => ({ ...action })),
    })),
    notifications: JOURNEY_DEMO_NOTIFICATIONS.map((item) => ({ ...item })),
  };
}

export type NotificationItemView = {
  id: string;
  schedule: string;
  when: string;
  text: string;
  answered?: string;
};

export function buildNotificationViews(
  notifications: JourneyNotification[],
  worlds: JourneyWorld[],
): NotificationItemView[] {
  return notifications.flatMap((note) => {
    const world = worlds.find((item) => item.id === note.worldId);
    const action = world?.actions.find((item) => item.id === note.actionId);
    if (!world || !action) return [];
    return [{
      id: note.id,
      schedule: action.schedule,
      when: note.when,
      text: action.text,
      answered: note.answered,
    }];
  });
}

export function useSpaceNotifications() {
  const [{ worlds, notifications }, setState] = useState(cloneDemo);

  const items = useMemo(
    () => buildNotificationViews(notifications, worlds),
    [notifications, worlds],
  );
  const hasUnread = notifications.some((item) => !item.answered);

  function answer(id: string, yes: boolean) {
    setState((prev) => {
      const note = prev.notifications.find((item) => item.id === id);
      if (!note) return prev;
      const nextWorlds = yes
        ? prev.worlds.map((world) => {
          if (world.id !== note.worldId) return world;
          return {
            ...world,
            actions: world.actions.map((action) =>
              action.id === note.actionId ? { ...action, acted: action.acted + 1 } : action,
            ),
          };
        })
        : prev.worlds;
      return {
        worlds: nextWorlds,
        notifications: prev.notifications.map((item) =>
          item.id === id ? { ...item, answered: yes ? "Saved." : "Noted." } : item,
        ),
      };
    });
  }

  return { items, hasUnread, answer };
}

export default function SpaceNotificationsDropdown({
  open,
  items,
  onAnswer,
}: {
  open: boolean;
  items: NotificationItemView[];
  onAnswer: (id: string, yes: boolean) => void;
}) {
  if (!open) return null;

  return (
    <div className="beta-notifs" role="dialog" aria-label="Notifications">
      {items.map((item) => (
        <div className="beta-notif" key={item.id}>
          <div className="beta-notif-eyebrow">
            Action · {item.schedule} · {item.when}
          </div>
          <h4 className="beta-notif-title">Have you acted today?</h4>
          <p className="beta-notif-text">{item.text}</p>
          {item.answered ? (
            <div className="beta-notif-done">{item.answered}</div>
          ) : (
            <div className="beta-notif-actions">
              <button className="beta-notif-btn primary" type="button" onClick={() => onAnswer(item.id, true)}>
                Yes, I did
              </button>
              <button className="beta-notif-btn" type="button" onClick={() => onAnswer(item.id, false)}>
                Not today
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
