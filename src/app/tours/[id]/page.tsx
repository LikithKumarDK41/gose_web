// src/app/tours/[id]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTourById, tours } from "@/lib/data/tours";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Timeline from "@/components/tour/Timeline";
import Link from "next/link";
import MapboxTourMap from "@/components/map/MapboxTourMap";
import NavLink from "@/components/nav/NavLink"; // ⬅️ add this

// pure-static export flags (optional)
export const dynamic = "error";
export const dynamicParams = false;
export const revalidate = false;

export function generateStaticParams() {
    return tours.map((t) => ({ id: t.id }));
}

type ParamsPromise = Promise<{ id: string }>;
export async function generateMetadata({ params }: { params: ParamsPromise }) {
    const { id } = await params;
    const tour = getTourById(id);
    return { title: tour ? tour.title : "Tour" };
}

export default async function TourDetailsPage({ params }: { params: ParamsPromise }) {
    const { id } = await params;
    const tour = getTourById(id);
    if (!tour) return notFound();

    return (
        <div className="space-y-8">
            {/* ===== Compact banner with centered overlay ===== */}
            <div className="relative overflow-hidden rounded-xl">
                <div className="relative h-56 w-full sm:h-64">
                    {tour.image ? (
                        <Image
                            src={tour.image}
                            alt={tour.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 1024px"
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                            <span className="text-sm">No image</span>
                        </div>
                    )}
                </div>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                    <div className="max-w-3xl">
                        <h1 className="text-2xl font-semibold text-white drop-shadow">
                            {tour.title}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
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

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border p-3">
                        <div className="text-xs text-muted-foreground">Created</div>
                        <div className="text-sm">{new Date(tour.createdAt).toLocaleDateString()}</div>
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

            {/* ===== Action bar (two buttons on the right) ===== */}
            <div className="flex flex-wrap items-center justify-end gap-3">
                {/* Loader-enabled navigation */}
                <Button size="lg" asChild>
                    <NavLink href={`/tours/${tour.id}/navigation`}>Get Started</NavLink>
                </Button>

                <Button size="lg" variant="outline" asChild>
                    <Link href="#timeline">Jump to Timeline</Link>
                </Button>
            </div>

            {/* ===== Map ===== */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Map</h2>
                <MapboxTourMap places={tour.places} profile="walking" />
            </section>

            {/* ===== Timeline ===== */}
            <section id="timeline" className="space-y-4">
                <h2 className="text-lg font-semibold">Timeline</h2>
                <Timeline places={tour.places} />
            </section>
        </div>
    );
}
