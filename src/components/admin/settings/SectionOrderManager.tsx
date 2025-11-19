"use client";

import { useState, useEffect } from "react";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = {
  id: string;
  name: string;
  order: number;
  show: boolean;
  orderKey: string;
};

type SectionOrderManagerProps = {
  sections: Section[];
  onOrderChange: (sections: Section[]) => void;
  disabled?: boolean;
};

function SortableSectionItem({
  section,
  index,
}: {
  section: Section;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
        "hover:bg-background/80 focus:bg-background/80",
        !section.show && "opacity-50",
        isDragging && "shadow-lg z-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none mr-2"
        style={{ touchAction: "none" }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 flex items-center gap-2">
        {section.show ? (
          <Eye className="h-4 w-4 text-muted-foreground" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={cn("text-sm", !section.show && "text-muted-foreground")}>
          {section.name}
        </span>
      </div>
      <div className="text-xs text-muted-foreground absolute right-2">Order: {index + 1}</div>
    </div>
  );
}

export function SectionOrderManager({
  sections: initialSections,
  onOrderChange,
  disabled = false,
}: SectionOrderManagerProps) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local state when initialSections change
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sorted = [...sections].sort((a, b) => a.order - b.order);
      const oldIndex = sorted.findIndex((s) => s.id === active.id);
      const newIndex = sorted.findIndex((s) => s.id === over.id);

      const newSections = arrayMove(sorted, oldIndex, newIndex);
      // Update order numbers based on new positions
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order: index + 1,
      }));

      setSections(updatedSections);
      onOrderChange(updatedSections);
    }
  };

  // Sort sections by current order for display
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground",
            "text-left"
          )}
        >
          <span className="text-xs text-muted-foreground">
            Order
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
        <PopoverContent className="w-[320px] p-4 bg-background/50 backdrop-blur-md text-foreground !shadow-[0px_1px_1px_0px_rgba(16,17,26,0.08)] dark:!shadow-[0px_1px_1px_0px_rgba(255,255,255,0.08)]" align="end">
          <div className="space-y-3">
            <div className="text-sm font-semibold mb-2">Drag to reorder sections</div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sortedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sortedSections.map((section, index) => (
                    <SortableSectionItem key={section.id} section={section} index={index} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </PopoverContent>
      </Popover>
  );
}

