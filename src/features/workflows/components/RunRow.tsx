"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Download, FileText, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkflowRun } from "../types/workflow.types";
import { formatRelativeTime, formatCurrency, formatDuration, parseOutputFiles } from "../utils";
import { MediaPreviewModal } from "./ImagePreviewModal";

type RunRowProps = {
  run: WorkflowRun;
  expanded: boolean;
  onToggle: () => void;
};

function StatusBadge({ status }: { status: WorkflowRun["status"] }) {
  const statusConfig = {
    pending: {
      label: "Pending",
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    running: {
      label: "Running",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    failed: {
      label: "Failed",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn("text-xs border-0", config.className)}>
      {config.label}
    </Badge>
  );
}

export function RunRow({ run, expanded, onToggle }: RunRowProps) {
  const outputFiles = parseOutputFiles(run.output_files);
  const error = run.execution_metadata?.error;
  const duration = formatDuration(run.started_at, run.completed_at);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewMediaName, setPreviewMediaName] = useState<string | null>(null);
  const [previewMediaType, setPreviewMediaType] = useState<string | null>(null);

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.includes("image");
  };

  const isVideoUrl = (url: string, type?: string) => {
    return type?.startsWith("video/") || /\.(mp4|webm|mov|avi|mkv)$/i.test(url) || url.includes("video");
  };

  const handleFileClick = (file: { name: string; url: string; type?: string }) => {
    if (isImageUrl(file.url) || file.type?.startsWith("image/")) {
      setPreviewMediaName(file.name);
      setPreviewMediaUrl(file.url);
      setPreviewMediaType("image");
    } else if (isVideoUrl(file.url, file.type)) {
      setPreviewMediaName(file.name);
      setPreviewMediaUrl(file.url);
      setPreviewMediaType("video");
    } else {
      // For other files, open in new tab
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-4 px-5 hover:bg-primary/5 transition-colors text-left relative group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                {run.workflow?.name || "Unknown Workflow"}
              </h4>
              <StatusBadge status={run.status} />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formatRelativeTime(run.started_at)}</span>
              {run.actual_cost !== null && (
                <>
                  <span>•</span>
                  <span>{formatCurrency(run.actual_cost)}</span>
                </>
              )}
              {duration !== "—" && (
                <>
                  <span>•</span>
                  <span>{duration}</span>
                </>
              )}
            </div>
          </div>
          <motion.div 
            className="flex-shrink-0"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: "auto", 
              opacity: 1,
              transition: {
                height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.25, delay: 0.1 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.2 }
              }
            }}
            className="overflow-hidden"
          >
            <motion.div 
              className="px-5 pb-4 space-y-4 bg-muted/20 backdrop-blur-sm"
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Input Data */}
              <motion.div 
                className="pt-4"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <pre className="text-xs bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border/50 overflow-x-auto">
                  {JSON.stringify(run.input_data, null, 2)}
                </pre>
              </motion.div>

              {/* Output Files */}
              {outputFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.2 }}
                >
                  <h5 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Output Files
                  </h5>
                  <div className="space-y-2">
                    {outputFiles.map((file, index) => {
                      const isImage = isImageUrl(file.url) || file.type?.startsWith("image/");
                      const isVideo = isVideoUrl(file.url, file.type);
                      
                      return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05, duration: 0.2 }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileClick(file);
                        }}
                        className="w-full flex items-center gap-2 text-sm text-primary hover:bg-primary/10 p-2.5 rounded-lg transition-colors text-left border border-border/30 hover:border-primary/30 bg-background/50 backdrop-blur-sm"
                      >
                          {isVideo ? (
                            <Video className="h-4 w-4 flex-shrink-0" />
                          ) : isImage ? (
                          <ImageIcon className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="flex-1 truncate">{file.name}</span>
                        <Download className="h-4 w-4 flex-shrink-0 opacity-50" />
                      </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Error Details */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                >
                  <h5 className="text-xs font-semibold text-destructive mb-2 uppercase tracking-wide">
                    Error
                  </h5>
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 backdrop-blur-sm">
                    {typeof error === "string" ? error : JSON.stringify(error, null, 2)}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview Modal */}
      {previewMediaUrl && (
        <MediaPreviewModal
          open={!!previewMediaUrl}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewMediaUrl(null);
              setPreviewMediaName(null);
              setPreviewMediaType(null);
            }
          }}
          mediaUrl={previewMediaUrl}
          mediaName={previewMediaName || undefined}
          mediaType={previewMediaType || undefined}
        />
      )}
    </div>
  );
}
