type AlbumHeaderProps = {
  title: string;
  artistName?: string | null;
  catalog_number?: string | null;
};

export default function AlbumHeader({ title, artistName, catalog_number }: AlbumHeaderProps) {
  return (
    <div className="space-y-2 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 sm:text-3xl">
        {artistName ? `${artistName} - ${title}` : title}
      </h1>
      {catalog_number ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{catalog_number}</p>
      ) : null}
    </div>
  );
}


