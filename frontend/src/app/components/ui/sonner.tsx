"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import type { ToasterProps } from "sonner";
import type { CSSProperties } from "react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f172a",
          "--normal-border": "#e2e8f0",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!bg-white !text-slate-950 !border-slate-200",
          title: "!text-slate-950 !font-bold",
          description: "!text-slate-700",
          actionButton: "!bg-slate-950 !text-white hover:!bg-slate-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
