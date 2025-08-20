// src/app/tours/page.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

type Tour = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  image?: string;
  tags?: string[];
};

const tours: Tour[] = [
  {
    id: "hoskeralli",
    title: "Hoskeralli Heritage Walk",
    description: "Explore calm lakes, temples, and sunset points in Hoskeralli.",
    createdAt: "2025-02-01",
    image: "https://picsum.photos/seed/hoskeralli/600/400",
    tags: ["Culture", "Easy"],
  },
  {
    id: "vijayanagar",
    title: "Vijayanagar City Circuit",
    description:
      "Food streets, temples, and buzzing markets in Vijayanagar. This one has a slightly longer description to prove the layout stays aligned.",
    createdAt: "2025-01-22",
    image: "https://picsum.photos/seed/vijaynagar/600/400",
    tags: ["Urban", "Food"],
  },
  {
    id: "south-blr",
    title: "South Bengaluru Temples & Lakes",
    description: "Family-friendly day exploring lakes and shrines.",
    createdAt: "2025-01-10",
    // no image
    tags: ["Scenic", "Family"],
  },
];

export default function ToursPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tour List</h1>
          <p className="text-muted-foreground">Discover curated tours with highlights and experiences.</p>
        </div>
        <Button asChild>
          <Link href="/tour">Create New Tour</Link>
        </Button>
      </div>

      {/* Equal-height grid */}
      <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
        {tours.map((tour) => (
          <Card
            key={tour.id}
            className="flex min-h-[420px] h-full flex-col overflow-hidden pt-0"
          >
            {/* Image / placeholder (fixed height so tops align) */}
            {tour.image ? (
              <img
                src={tour.image}
                alt={tour.title}
                className="h-40 w-full rounded-t-lg object-cover"
              />
            ) : (
              <div className="grid h-40 w-full place-items-center rounded-t-lg bg-muted text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}

            <CardHeader className="px-4 pt-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="line-clamp-1 text-lg font-semibold">{tour.title}</h2>
                <span className="text-xs text-muted-foreground">
                  {new Date(tour.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardHeader>

            {/* Content grows to fill, button pinned to bottom */}
            <CardContent className="flex flex-1 flex-col gap-3 px-4 pb-2">
              <p className="line-clamp-3 text-sm text-muted-foreground">{tour.description}</p>

              <div className="flex flex-wrap gap-2">
                {tour.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Footer area – pushes button to the bottom */}
              <div className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={`/tours/${tour.id}`}>View Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
