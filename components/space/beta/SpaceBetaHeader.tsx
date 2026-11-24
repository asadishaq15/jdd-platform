"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  topStart,
  showUiToggle = true,
}: {
  account: AccountSummary;
  menuOpen: boolean;
  uiVersion: SpaceUiVersion;
  onUiVersionChange: (version: SpaceUiVersion) => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onProfileAction: (action: SpaceProfileAction) => void;
  onSignOut: () => void;
  /** Top-left control (e.g. Back on detail windows), matching AuthShell topStart. */
  topStart?: ReactNode;
  /** New/Classic toggle — hidden on overlay pages like Explore. */
  showUiToggle?: boolean;
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

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".pmenu-wrap")) onCloseMenu();
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen, onCloseMenu]);

  function openAction(action: SpaceProfileAction) {
    setBellOpen(false);
    onCloseMenu();
    onProfileAction(action);
  }

  return (
    <header className="top dash-top beta-header">
      {topStart ?? <span aria-hidden="true" />}
      <div className="dash-brand">
        <BrandMark className="dash-logo" />
        <span className="dash-title">My Space</span>
      </div>
      <div className="dash-controls">
        {showUiToggle ? (
          <SpaceUiToggle version={uiVersion} onChange={onUiVersionChange} />
        ) : null}
        {/* Order matches My Journey: light mode → bell (+dot) → profile */}
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
              <path d="M6 17V11a6 6 0 0 1 12 0v6M4 17h16M10 20h4" />
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
              <button className="pm-item" role="menuitem" type="button" onClick={() => openAction("events")}>
                My events
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
