type CoverArtProps = {
  title: string;
  coverImageUrl?: string | null;
};

export default function CoverArt({ title, coverImageUrl }: CoverArtProps) {
  const titleInitial = title ? title.charAt(0).toUpperCase() : "A";

  return coverImageUrl ? (
    <div
      className="relative aspect-square rounded-2xl"
      style={{ filter: "drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl">
        <img src={coverImageUrl} alt={title} className="h-full w-full object-cover" />
      </div>
    </div>
  ) : (
    <div
      className="relative aspect-square rounded-2xl"
      style={{ filter: "drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40">
        <div className="flex h-full items-center justify-center">
          <span className="text-6xl font-bold text-primary/60">{titleInitial}</span>
        </div>
      </div>
    </div>
  );
}
