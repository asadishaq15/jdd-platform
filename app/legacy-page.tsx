"use client";

import { useEffect, useId } from "react";

type LegacyPageProps = {
  title: string;
  links: string[];
  style: string;
  body: string;
  script: string;
};

export default function LegacyPage({ title, links, style, body, script }: LegacyPageProps) {
  const scopeId = useId();

  useEffect(() => {
    document.title = title;

    const managedNodes: HTMLElement[] = [];

    for (const linkHtml of links) {
      const template = document.createElement("template");
      template.innerHTML = linkHtml.trim();
      const link = template.content.firstElementChild;
      if (link instanceof HTMLLinkElement) {
        link.dataset.legacyPage = scopeId;
        document.head.appendChild(link);
        managedNodes.push(link);
      }
    }

    const styleEl = document.createElement("style");
    styleEl.dataset.legacyPage = scopeId;
    styleEl.textContent = style;
    document.head.appendChild(styleEl);
    managedNodes.push(styleEl);

    const metaTheme = document.querySelector('meta[name="theme-color"]') || document.createElement("meta");
    metaTheme.setAttribute("name", "theme-color");
    metaTheme.setAttribute("content", "#F4F4F2");
    if (!metaTheme.parentElement) document.head.appendChild(metaTheme);

    const run = new Function(script);
    run();

    return () => {
      for (const node of managedNodes) node.remove();
      document.body.className = "";
      document.body.style.cssText = "";
    };
  }, [links, scopeId, script, style, title]);

  return <div dangerouslySetInnerHTML={{ __html: body }} />;
}
