'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, X } from 'lucide-react';
import { useLocale } from '@/providers/LocaleProvider';

const sampleTours = [
  {
    id: 1,
    name: '東京ツアー (Tokyo Tour)',
    description: 'tokyo_tour_desc',
    videos: [
      '/videos/JP%20Part%201_0%201.mp4',
      '/videos/JP%20part%202_0%201.mp4',
    ],
  },
  {
    id: 2,
    name: '京都ツアー (Kyoto Tour)',
    description: 'kyoto_tour_desc',
    videos: [
      '/videos/JP%20Part%201_0%201.mp4',
      '/videos/JP%20part%202_0%201.mp4',
    ],
  },
  {
    id: 3,
    name: '大阪ツアー (Osaka Tour)',
    description: 'osaka_tour_desc',
    videos: [
      '/videos/JP%20Part%201_0%201.mp4',
      '/videos/JP%20part%202_0%201.mp4',
    ],
  },
];

export default function VideoGalleryPage() {
  const {t} = useLocale();
  const [tours, setTours] = React.useState(sampleTours);
  const [selectedTour, setSelectedTour] = React.useState<number | null>(null);
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = React.useState<string | null>(null);

  const handleUpload = () => {
    if (!selectedTour || !videoFile) return;
    const fileURL = URL.createObjectURL(videoFile);
    setTours((prev) =>
      prev.map((tour) =>
        tour.id === selectedTour
          ? { ...tour, videos: [...tour.videos, fileURL] }
          : tour
      )
    );
    setVideoFile(null);
    setSelectedTour(null);
  };

  return (
    <main className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🎥 ツアービデオ (Tour Videos)</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>{t("upload_video")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("upload_video")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>{t("select_tour")}</Label>
                <Select onValueChange={(v) => setSelectedTour(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("choose_tour")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map((tour) => (
                      <SelectItem key={tour.id} value={String(tour.id)}>
                        {tour.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="video">{t("choose_video_file")}</Label>
                <Input
                  id="video"
                  type="file"
                  className="w-full"
                  accept="video/*"
                  onChange={(e) =>
                    setVideoFile(e.target.files ? e.target.files[0] : null)
                  }
                />
              </div>

              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={!selectedTour || !videoFile}
              >
                {t("upload")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {tours.map((tour) => (
          <Card key={tour.id} className="shadow-lg border">
            <CardHeader>
              <CardTitle>{tour.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{t(tour.description)}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tour.videos.map((vid, idx) => (
                  <VideoThumbnail
                    key={vid + idx}
                    videoUrl={vid}
                    onClick={() => setFullscreenVideo(vid)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {fullscreenVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <button
            className="absolute top-6 right-6 text-white hover:text-red-500"
            onClick={() => setFullscreenVideo(null)}
          >
            <X className="w-8 h-8" />
          </button>

          {fullscreenVideo.includes('youtube.com') ? (
            <iframe
              src={fullscreenVideo}
              className="w-11/12 h-5/6 rounded-lg shadow-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={fullscreenVideo}
              className="w-11/12 h-5/6 rounded-lg shadow-lg"
              controls
              autoPlay
            />
          )}
        </div>
      )}
    </main>
  );
}

/* --------------------------
   🔹 Video Thumbnail with Loader
--------------------------- */
function VideoThumbnail({
  videoUrl,
  onClick,
}: {
  videoUrl: string;
  onClick: () => void;
}) {
  const [loading, setLoading] = React.useState(true);

  return (
    <div
      className="relative aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
      onClick={onClick}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-300 dark:bg-gray-700">
          {/* Spinner loader */}
          <svg
            className="animate-spin h-8 w-8 text-gray-600 dark:text-gray-200"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
        </div>
      )}

      {videoUrl.includes('youtube.com') ? (
        <iframe
          src={videoUrl}
          className="w-full h-full object-cover"
          onLoad={() => setLoading(false)}
        />
      ) : (
        <video
          src={videoUrl}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition"
          muted
          onLoadedData={() => setLoading(false)}
        />
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black bg-opacity-50 p-3 rounded-full">
          <Play className="w-10 h-10 text-white" />
        </div>
      </div>
    </div>
  );
}
