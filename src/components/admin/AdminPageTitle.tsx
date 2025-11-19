import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AdminPageTitleProps = {
  title: string;
  entityName?: string;
  description?: string;
  entityType?: "album" | "event" | "update";
};

const getEntityTypeBadge = (type?: "album" | "event" | "update") => {
  if (!type) return null;

  const badgeConfig = {
    album: { label: "Album", className: "text-blue-500 border-blue-500 bg-blue-500/10" },
    event: { label: "Event", className: "text-orange-500 border-orange-500 bg-orange-500/10" },
    update: { label: "Update", className: "text-emerald-500 border-emerald-500 bg-emerald-500/10" },
  };

  const config = badgeConfig[type];
  return (
    <Badge variant="outline" className={cn("ml-3 text-xs font-semibold", config.className)}>
      {config.label}
    </Badge>
  );
};

export function AdminPageTitle({
  title,
  entityName,
  description,
  entityType,
}: AdminPageTitleProps) {
  if (entityName) {
    return (
      <div>
        <h1 className="text-4xl font-bold text-foreground">
          {entityName} <span className="text-muted-foreground text-base font-normal">EDIT</span>
        </h1>
        {description && <p className="text-muted-foreground mt-2 text-base">{description}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline">
        <h1 className="text-4xl font-bold text-foreground">{title}</h1>
        {getEntityTypeBadge(entityType)}
      </div>
      {description && <p className="text-muted-foreground mt-2 text-base">{description}</p>}
    </div>
  );
}
