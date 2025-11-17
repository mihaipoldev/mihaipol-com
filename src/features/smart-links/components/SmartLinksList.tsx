import SmartLinkItem, { SmartLink } from "./SmartLinkItem";

type SmartLinksListProps = {
  links: SmartLink[];
  disableTracking?: boolean;
};

export default function SmartLinksList({ links, disableTracking }: SmartLinksListProps) {
  if (links.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">No links available yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {links.map((link) => (
        <SmartLinkItem
          key={link.id}
          link={link}
          className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
          debug={{ link }}
          disableTracking={disableTracking}
        />
      ))}
    </div>
  );
}


