import * as React from "react";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

type MarkdownProps = {
  children: string;
  className?: string;
};

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("prose prose-lg dark:prose-invert max-w-none", className)}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
