import Link from "next/link";
import { tours } from "@/lib/data/tours";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";

export default function RelatedTours({ currentId }: { currentId: string }) {
    const related = tours.filter((t) => t.id !== currentId).slice(0, 3);
    if (!related.length) return null;

    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold">Related tours</h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {related.map((tour) => (
                    <Card key={tour.id} className="overflow-hidden">
                        {tour.image ? (
                            <img
                                src={tour.image}
                                alt={tour.title}
                                className="h-36 w-full object-cover"
                            />
                        ) : (
                            <div className="grid h-36 w-full place-items-center bg-muted text-muted-foreground">
                                <ImageIcon className="h-6 w-6" />
                            </div>
                        )}
                        <CardHeader className="px-4 pt-3">
                            <h3 className="line-clamp-1 text-sm font-semibold">
                                {tour.title}
                            </h3>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {tour.tags?.slice(0, 2).map((t) => (
                                    <Badge key={t} variant="secondary">
                                        {t}
                                    </Badge>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <Button asChild className="w-full">
                                <Link href={`/tours/${tour.id}`}>View</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
