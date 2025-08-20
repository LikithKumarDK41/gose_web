// src/app/tours/[id]/page.tsx
import { notFound } from "next/navigation";
import { getTourById, tours } from "@/lib/data/tours";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Timeline from "@/components/tour/Timeline";
import Link from "next/link";

// pure-static export flags (optional)
export const dynamic = "error";
export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams() {
    return tours.map((t) => ({ id: t.id }));
}

// Next 15: params is a Promise in server components
type ParamsPromise = Promise<{ id: string }>;

export async function generateMetadata({
    params,
}: {
    params: ParamsPromise;
}) {
    const { id } = await params;
    const tour = getTourById(id);
    return { title: tour ? tour.title : "Tour" };
}

export default async function TourDetailsPage({
    params,
}: {
    params: ParamsPromise;
}) {
    const { id } = await params;
    const tour = getTourById(id);
    if (!tour) return notFound();

    return (
        <div className="space-y-8">
            {/* ===== Header with vertically centered overlay ===== */}
            <div className="relative overflow-hidden rounded-xl">
                <div className="aspect-[16/9] w-full">
                    {tour.image ? (
                        <img
                            src={tour.image}
                            alt={tour.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                            <span className="text-sm">No image</span>
                        </div>
                    )}
                </div>

                {/* gradient + centered content */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 md:px-8 text-center">
                    <div className="max-w-3xl">
                        <h1 className="text-3xl font-semibold text-white drop-shadow">{tour.title}</h1>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                            {tour.tags?.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Details (no Card) ===== */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold">About this tour</h2>
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {tour.description}
                </p>

                {/* add a little more helpful, static info */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border p-3">
                        <div className="text-xs text-muted-foreground">Created</div>
                        <div className="text-sm">
                            {new Date(tour.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                        <div className="text-xs text-muted-foreground">Stops</div>
                        <div className="text-sm">{tour.places.length}</div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                        <div className="text-xs text-muted-foreground">Suggested gear</div>
                        <div className="text-sm">Water, comfy shoes, sun protection</div>
                    </div>
                </div>
            </section>

            {/* ===== Action bar ===== */}
            <div className="flex flex-wrap items-center gap-3">
                <Button size="lg">Start Trip</Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="#timeline">Jump to Timeline</Link>
                </Button>
            </div>

            {/* ===== Timeline ===== */}
            <section id="timeline" className="space-y-4">
                <h2 className="text-lg font-semibold">Timeline</h2>
                <Timeline places={tour.places} />
            </section>
        </div>
    );
}
