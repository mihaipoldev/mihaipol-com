import React from "react";
import clsx from "clsx";

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, description, className, actions }: PageHeaderProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-4 sm:gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        {description ? <p className="text-lg text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
