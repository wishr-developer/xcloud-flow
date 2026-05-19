"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fall back to a prompt if clipboard isn't available
      window.prompt("コピーしてください", text);
    }
  }
  return (
    <Button size="sm" variant="outline" type="button" onClick={onClick}>
      {copied ? (
        <>
          <Check className="mr-1 h-3 w-3" />
          コピーしました
        </>
      ) : (
        <>
          <Copy className="mr-1 h-3 w-3" />
          コピー
        </>
      )}
    </Button>
  );
}
