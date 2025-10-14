"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchMonumentDetails, clearMonumentDetail } from "@/lib/store/slices/touristSlice";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ImageIcon, MapPin } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";
import { useGlobalLoader } from "@/providers/LoaderProvider";

export default function MonumentDetailPage() {
  const sp = useSearchParams();
  const id = sp.get("id");
  const dispatch = useDispatch<any>();
  const { t } = useLocale();
  const { show, hide } = useGlobalLoader();
  const monumentDetail = useSelector((state: any) => state.tourist.monumentDetail);
  const loading = useSelector((state: any) => state.tourist.loading);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchMonumentDetails(id));
    return () => dispatch(clearMonumentDetail());
  }, [id, dispatch]);

  const detailsToShow = monumentDetail;

  if (loading || !detailsToShow)
    return (
      <div className="flex justify-center items-center h-[70vh] text-muted-foreground">
        Loading...
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl w-full px-4 py-6 space-y-6">
      {/* 🏛️ Monument Header */}
      <div className="relative h-80 w-full overflow-hidden rounded-xl bg-muted">
        {detailsToShow.image?.secure_url ? (
          <Image
            src={detailsToShow.image.secure_url}
            alt={detailsToShow.title || "Monument Image"}
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{detailsToShow.title}</h1>

        {detailsToShow.region?.title && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{detailsToShow.region.title}</span>
          </div>
        )}

        {detailsToShow.content?.brief && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {(detailsToShow.content.brief || "")
              .replace(/<[^>]+>/g, "")
              .replace(/&nbsp;|&#160;/gi, " ")
              .trim()}
          </p>
        )}
      </div>

      {/* 🖼️ Gallery */}
      {!!detailsToShow.gallery?.length && (
        <div>
          <h3 className="text-base font-semibold mb-3">Gallery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {detailsToShow.gallery.map((img: any, i: number) => (
              <div key={i} className="relative h-40 rounded-md overflow-hidden bg-muted">
                <Image
                  src={img.secure_url || "/placeholder.png"}
                  alt={`Gallery ${i}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔗 Related Tours */}
      {!!detailsToShow.relatedtours?.length && (
        <div className="pt-4 border-t border-border">
          <h3 className="text-base font-semibold mb-3">Related Tours</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {detailsToShow.relatedtours.map((tour: any) => (
              <div
                key={tour._id}
                className="group rounded-lg overflow-hidden border bg-card/60 ring-1 ring-border hover:ring-primary/40 hover:shadow-md transition-all"
              >
                <div className="relative h-36 w-full">
                  {tour.image?.secure_url ? (
                    <Image
                      src={tour.image.secure_url}
                      alt={tour.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1">
                  <h5 className="text-sm font-medium truncate">{tour.title}</h5>
                  {tour.content?.brief && (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {tour.content.brief.replace(/<[^>]+>/g, "").trim()}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() =>
                      window.open(`/tours/detail?id=${tour._id}`, "_self")
                    }
                  >
                    View Tour
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🏛️ Nearby Monuments */}
      {!!detailsToShow.nearbymonuments?.length && (
        <div className="pt-6 border-t border-border">
          <h3 className="text-base font-semibold mb-3">Nearby Monuments</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {detailsToShow.nearbymonuments.map((monument: any) => (
              <div
                key={monument._id}
                className="group rounded-lg overflow-hidden border bg-card/60 ring-1 ring-border hover:ring-primary/40 hover:shadow-md transition-all"
              >
                <div className="relative h-36 w-full">
                  {monument.image?.secure_url ? (
                    <Image
                      src={monument.image.secure_url}
                      alt={monument.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 300px"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1">
                  <h5 className="text-sm font-medium truncate">
                    {monument.title}
                  </h5>

                  {monument.content?.brief && (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {monument.content.brief
                        .replace(/<[^>]+>/g, "")
                        .replace(/&nbsp;|&#160;/gi, " ")
                        .trim()}
                    </p>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() =>
                      window.open(`/monument/detail?id=${monument._id}`, "_self")
                    }
                  >
                    View Monument
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
