type AdminPageTitleProps = {
  title: string;
  entityName?: string;
};

export function AdminPageTitle({ title, entityName }: AdminPageTitleProps) {
  if (entityName) {
    return (
      <h1 className="text-3xl font-bold text-foreground">
        {entityName}{" "}
        <span className="text-muted-foreground text-sm font-normal">EDIT</span>
      </h1>
    );
  }

  return (
    <h1 className="text-3xl font-bold text-foreground">
      {title}
    </h1>
  );
}

