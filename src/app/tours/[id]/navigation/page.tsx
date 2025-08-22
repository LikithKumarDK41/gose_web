// src/app/tours/[id]/navigation/page.tsx
import { notFound } from "next/navigation";
import { getTourById, tours } from "@/lib/data/tours";
import MapboxTourMapNavigation from "@/components/map/MapboxTourMapNavigation";
import NavigationOverlay from "@/components/map/NavigationOverlay";

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
  return { title: tour ? `${tour.title} – Navigation` : "Navigation" };
}

export default async function NavigationPage({ params }: { params: ParamsPromise }) {
  const { id } = await params;
  const tour = getTourById(id);
  if (!tour) return notFound();

  return (
    <div className="fixed inset-0 z-50">
      <MapboxTourMapNavigation places={tour.places} profile="walking" height="100vh" />
      {/* IMPORTANT: pass tourId and places so Start can initialize the global run */}
      <NavigationOverlay tourId={tour.id} places={tour.places} defaultProfile="walking" />
    </div>
  );
}
