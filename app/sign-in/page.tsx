"use client";

import { useRouter } from "next/navigation";
import BrandMark from "../../components/brand/BrandMark";
import GradientDefs from "../../components/layout/GradientDefs";
import ThemeToggle from "../../components/layout/ThemeToggle";
import VisitorAuthPanel from "../../components/auth/VisitorAuthPanel";
import "../../components/onboarding/visitor-onboarding.css";
import "../../components/auth/auth.css";

export default function SignInPage() {
  const router = useRouter();

  return (
    <main className="visitor-app">
      <GradientDefs />
      <header className="top">
        <span aria-hidden="true" style={{ minWidth: 44 }} />
        <BrandMark className="mark" />
        <div className="top-r">
          <ThemeToggle />
        </div>
      </header>
      <div className="screens">
        <section className="scr on" data-name="login" aria-label="Enter your private space">
          <VisitorAuthPanel
            nextPath="/auth/complete"
            onCode={() => router.push("/?scene=code")}
          />
        </section>
      </div>
    </main>
  );
}
