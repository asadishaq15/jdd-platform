"use client";

import { useEffect, useState } from "react";
import BrandMark from "../../brand/BrandMark";
import ThemeToggle from "../../layout/ThemeToggle";
import type { AccountSummary } from "../../../lib/space-data";
import type { SpaceUiVersion } from "../../../lib/space-ui-version";
import SpaceUiToggle from "../SpaceUiToggle";
import SpaceNotificationsDropdown, { useSpaceNotifications } from "./SpaceNotificationsDropdown";

export type SpaceProfileAction =
  | "account"
  | "orders"
  | "journey"
  | "stays"
  | "events"
  | "reminders"
  | "explore"
  | "legal"
  | "delete";

export default function SpaceBetaHeader({
  account,
  menuOpen,
  uiVersion,
  onUiVersionChange,
  onToggleMenu,
  onCloseMenu,
  onProfileAction,
  onSignOut,
}: {
  account: AccountSummary;
  menuOpen: boolean;
  uiVersion: SpaceUiVersion;
  onUiVersionChange: (version: SpaceUiVersion) => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onProfileAction: (action: SpaceProfileAction) => void;
  onSignOut: () => void;
}) {
  const initial = account.fullName.trim().charAt(0).toUpperCase() || "G";
  const [bellOpen, setBellOpen] = useState(false);
  const { items, hasUnread, answer } = useSpaceNotifications();

  useEffect(() => {
    if (!bellOpen) return;
    function onDocClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".beta-bell-wrap")) setBellOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [bellOpen]);

  useEffect(() => {
    if (menuOpen) setBellOpen(false);
  }, [menuOpen]);

  function openAction(action: SpaceProfileAction) {
    setBellOpen(false);
    onCloseMenu();
    onProfileAction(action);
  }

  return (
    <header className="top dash-top beta-header">
      <span aria-hidden="true" />
      <div className="dash-brand">
        <BrandMark className="dash-logo" />
        <span className="dash-title">My Space</span>
      </div>
      <div className="dash-controls">
        <SpaceUiToggle version={uiVersion} onChange={onUiVersionChange} />
        <ThemeToggle />
        <div className="beta-bell-wrap">
          <button
            type="button"
            className="beta-bell"
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={bellOpen}
            onClick={(event) => {
              event.stopPropagation();
              onCloseMenu();
              setBellOpen((value) => !value);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9.5a6 6 0 0 1 12 0c0 3.2.9 4.4 1.4 5.2.3.4 0 1-.5 1H5.1c-.5 0-.8-.6-.5-1 .5-.8 1.4-2 1.4-5.2Z" />
              <path d="M10 18.2a2.2 2.2 0 0 0 4 0" />
            </svg>
            {hasUnread ? <span className="beta-bell-badge" aria-hidden="true" /> : null}
          </button>
          <SpaceNotificationsDropdown open={bellOpen} items={items} onAnswer={answer} />
        </div>
        <div className="pmenu-wrap">
          <button
            className="profile"
            type="button"
            aria-label="Account menu"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => {
              setBellOpen(false);
              onToggleMenu();
            }}
          >
            {account.avatarUrl
              ? <img src={account.avatarUrl} alt="" referrerPolicy="no-referrer" />
              : initial}
          </button>
          {menuOpen && (
            <div className="pmenu beta-pmenu" role="menu">
              <div className="pm-head">
                <p className="pm-name">{account.fullName}</p>
                <p className="pm-mail">{account.email}</p>
              </div>
              <button className="pm-item" role="menuitem" type="button" onClick={() => openAction("account")}>
                My account
              </button>
              <button className="pm-item" role="menuitem" type="button" onClick={() => openAction("orders")}>
                My orders
              </button>
              <button className="pm-item" role="menuitem" type="button" onClick={() => openAction("journey")}>
                My journey
              </button>
              <button className="pm-item" role="menuitem" type="button" onClick={() => openAction("stays")}>
                My stays
              </button>
              <button className="pm-item" role="menuitem" type="button" onClick={() => openAction("events")}>
                My events
              </button>
              <button className="pm-item" role="menuitem" type="button" onClick={() => openAction("reminders")}>
                Reminders
              </button>
              <button className="pm-item" role="menuitem" type="button" onClick={() => openAction("explore")}>
                Explore all States
              </button>
              <span className="pm-rule" />
              <button className="pm-item small" role="menuitem" type="button" onClick={() => openAction("legal")}>
                Terms of Use · Privacy Policy
              </button>
              <button className="pm-item small" role="menuitem" type="button" onClick={() => openAction("delete")}>
                Delete account
              </button>
              <button className="pm-item small" role="menuitem" type="button" onClick={() => { onCloseMenu(); onSignOut(); }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
