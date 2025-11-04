"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/providers/LocaleProvider";
import { MapPin, X, ImageIcon, Info, Coffee, Store } from "lucide-react";
import { useRef, useEffect } from "react";

interface PlaceDetailModalProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  details: any;
}

export default function PlaceDetailModal({ open, onClose, loading, details }: PlaceDetailModalProps) {
  const { t } = useLocale();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (details && contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [details]);

  const safeText = (v: any): string =>
    !v ? "" : typeof v === "string" ? v : v.title || v.name || "";

  const stripHTML = (html?: string): string =>
    html ? html.replace(/<[^>]+>/g, "").trim() : "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false}
        className="z-50 w-screen h-screen bg-background p-0 !max-w-full overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="flex items-center border-b bg-background py-4 px-8 relative">
          <DialogTitle className="text-xl font-semibold truncate mx-auto">
            {safeText(details?.title || details?.name)}
          </DialogTitle>

          <button
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-200 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-6 w-6" />
          </button>
        </DialogHeader>

        {/* Body */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-10">
          {loading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : details && (
            <>
              {/* Image */}
              {details.image?.secure_url && (
                <div className="relative h-[420px] w-full overflow-hidden rounded-xl shadow-md ring-1 ring-border">
                  <Image
                    src={details.image.secure_url}
                    alt={safeText(details.title)}
                    fill
                    className="object-cover hover:scale-105 transition-transform"
                  />
                </div>
              )}

              {/* Title + Category */}
              <section>
                <h2 className="text-2xl font-bold tracking-tight">
                  {safeText(details.title || details.name)}
                </h2>

                {details.category?.title && (
                  <p className="mt-1 text-sm flex items-center gap-2 text-muted-foreground">
                    {details.category.title}
                    <Badge variant="secondary">
                      {details.category.name || ""}
                    </Badge>
                  </p>
                )}
              </section>

              {/* Content */}
              {(details.content?.brief || details.content?.extended) && (
                <section className="prose max-w-none text-sm text-muted-foreground dark:prose-invert space-y-3">
                  {details.content?.brief && (
                    <div dangerouslySetInnerHTML={{ __html: details.content.brief }} />
                  )}
                  {details.content?.extended && (
                    <div dangerouslySetInnerHTML={{ __html: details.content.extended }} />
                  )}
                </section>
              )}

              {/* Address */}
              {details.content && stripHTML(details.content.extended)?.match(/\d{2,}-\d+/) && (
                <section>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-gray-500" /> {t("shortcut.tourist_attraction_details.address")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {stripHTML(details.content.extended)}
                  </p>
                </section>
              )}

              {/* Image Credit */}
              {details.imagecredit && (
                <section>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4 text-gray-500" /> {t("shortcut.tourist_attraction_details.image_credit")}
                  </h3>
                  <p className="text-sm text-muted-foreground">{stripHTML(details.imagecredit)}</p>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-background p-6">
          <Button
            size="lg"
            className="w-full rounded-full flex items-center justify-center gap-2 bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <MapPin className="h-5 w-5" />
            {t("tourDetails.checkIn")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
