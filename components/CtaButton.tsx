"use client";

import { useState } from "react";
import Link from "next/link";

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
      <Link
        href="/signup"
        style={{
          display: "inline-block",
          border: "1px solid #a855f7",
          color: hovered ? "#ffffff" : "#c084fc",
          backgroundColor: hovered ? "#9333ea" : "transparent",
          padding: "0.625rem 2rem",
          borderRadius: "0.375rem",
          fontSize: "0.9375rem",
          fontWeight: 500,
          transition: "background-color 0.2s ease, color 0.2s ease",
          textDecoration: "none",
        }}
      >
        Get started for free →
      </Link>
    </div>
  );
}
