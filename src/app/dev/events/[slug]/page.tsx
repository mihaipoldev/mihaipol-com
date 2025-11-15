interface EventPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">Event page</h1>
        <p className="text-muted-foreground mb-2">Coming soon</p>
        <p className="text-sm text-muted-foreground">Slug: {slug}</p>
      </div>
    </div>
  )
}

