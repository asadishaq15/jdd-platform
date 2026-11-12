"use client";

import BrandMark from "../../brand/BrandMark";
import ThemeToggle from "../../layout/ThemeToggle";
import type { AccountSummary } from "../../../lib/space-data";
import type { SpaceUiVersion } from "../../../lib/space-ui-version";
import SpaceUiToggle from "../SpaceUiToggle";

export default function SpaceBetaHeader({
  account,
  menuOpen,
  uiVersion,
  onUiVersionChange,
  onToggleMenu,
  onOpenAccount,
  onSignOut,
}: {
  account: AccountSummary;
  menuOpen: boolean;
  uiVersion: SpaceUiVersion;
  onUiVersionChange: (version: SpaceUiVersion) => void;
  onToggleMenu: () => void;
  onOpenAccount: () => void;
  onSignOut: () => void;
}) {
  const initial = account.fullName.trim().charAt(0).toUpperCase() || "G";

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
        <button
          type="button"
          className="beta-bell"
          aria-label="Notifications (coming soon)"
          disabled
          title="Notifications coming soon"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9.5a6 6 0 0 1 12 0c0 3.2.9 4.4 1.4 5.2.3.4 0 1-.5 1H5.1c-.5 0-.8-.6-.5-1 .5-.8 1.4-2 1.4-5.2Z" />
            <path d="M10 18.2a2.2 2.2 0 0 0 4 0" />
          </svg>
        </button>
      </div>
      <div className="pmenu-wrap">
        <button
          className="profile"
          type="button"
          aria-label="Account menu"
          aria-haspopup="true"
          aria-expanded={menuOpen}
          onClick={onToggleMenu}
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
            <button className="pm-item" role="menuitem" type="button" onClick={onOpenAccount}>
              My account
            </button>
            <button className="pm-item small" role="menuitem" type="button" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
