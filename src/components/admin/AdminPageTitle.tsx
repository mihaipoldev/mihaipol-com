type AdminPageTitleProps = {
  title: string;
  entityName?: string;
  description?: string;
};

export function AdminPageTitle({ title, entityName, description }: AdminPageTitleProps) {
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
      <h1 className="text-4xl font-bold text-foreground">{title}</h1>
      {description && <p className="text-muted-foreground mt-2 text-base">{description}</p>}
    </div>
  );
}
