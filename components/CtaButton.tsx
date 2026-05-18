"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        display: "inline-block",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
        transition: "transform 0.2s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Button size="lg" asChild>
        <Link href="/signup">Get started for free →</Link>
      </Button>
    </div>
  );
}
