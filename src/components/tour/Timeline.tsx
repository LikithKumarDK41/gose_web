'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { ImageIcon, CheckCircle2, Info } from 'lucide-react';

import type { Place } from '@/lib/data/tourTypes';
import { useAppSelector } from '@/lib/store/hook';
import { selectActiveTour, selectTourById } from '@/lib/store/slices/toursSlice';

type Props = {
    /** Optional: show the timeline for a specific tour. Defaults to active tour. */
    tourId?: string;
};

// Some places may include tags in seed or later edits
type PlaceWithTags = Place & { tags?: string[] };
const getTags = (p: Place): string[] => (p as PlaceWithTags).tags ?? [];

export default function Timeline({ tourId }: Props) {
    // Pull tour from Redux (prefer explicit tourId, else active)
    const tourById = useAppSelector(tourId ? selectTourById(tourId) : () => null);
    const activeTour = useAppSelector(selectActiveTour);
    const tour = tourById ?? activeTour;

    const places = tour?.places ?? [];

    // Local “checked-in” UI state (you can wire to Redux later if desired)
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [openId, setOpenId] = useState<string | null>(null);

    const active = useMemo(
        () => places.find((p) => p.id === openId) ?? null,
        [openId, places]
    );

    if (!tour) {
        return (
            <div className="flex min-h-[30vh] items-center justify-center">
                <div className="text-sm text-muted-foreground">No tour selected.</div>
            </div>
        );
    }

    if (places.length === 0) {
        return (
            <div className="flex min-h-[30vh] items-center justify-center">
                <div className="text-sm text-muted-foreground">This tour has no places yet.</div>
            </div>
        );
    }

    return (
        <div className="relative mx-auto max-w-5xl">
            {/* Center spine (desktop only) */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border md:block" />

            <ul className="space-y-10">
                {places.map((p, index) => {
                    const isChecked = !!checked[p.id];
                    const isLeft = index % 2 === 0;
                    const tags = getTags(p);

                    return (
                        <li key={p.id} className="relative w-full">
                            {/* Number chip on spine (desktop) */}
                            <div className="absolute left-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-background shadow ring-1 ring-border md:flex">
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {index + 1}
                                </span>
                            </div>

                            {/* --- Desktop (alternating) --- */}
                            <div className="hidden md:flex">
                                <div
                                    className={`relative flex w-1/2 ${isLeft ? 'justify-end pr-6' : 'justify-start pl-6 ml-auto'
                                        }`}
                                >
                                    {/* Connector from spine to card */}
                                    <div
                                        className={`absolute top-1/2 h-px w-8 bg-border ${isLeft ? 'right-0' : 'left-0'
                                            }`}
                                    />

                                    {/* Card */}
                                    <article className="group grid w-[20rem] max-w-full items-center gap-4 rounded-xl border bg-card/80 p-4 shadow-sm transition-all hover:-translate-y-[2px] hover:shadow-md md:w-[24rem]">
                                        {/* Thumb */}
                                        <button
                                            aria-label={`Open ${p.name}`}
                                            onClick={() => setOpenId(p.id)}
                                            className="relative h-28 w-full overflow-hidden rounded-md bg-muted ring-1 ring-border"
                                        >
                                            {p.image ? (
                                                <Image
                                                    src={p.image}
                                                    alt={p.name}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 384px"
                                                    className="object-cover"
                                                    priority={index < 2}
                                                />
                                            ) : (
                                                <div className="grid h-full w-full place-items-center text-muted-foreground">
                                                    <ImageIcon className="h-5 w-5" />
                                                </div>
                                            )}
                                        </button>

                                        {/* Main */}
                                        <div className="min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <h3
                                                    className="truncate text-sm font-semibold"
                                                    title={p.name}
                                                    onClick={() => setOpenId(p.id)}
                                                    role="button"
                                                >
                                                    {p.name}
                                                </h3>
                                                <div className="shrink-0 text-right text-xs text-muted-foreground">
                                                    {p.time ?? ''}
                                                </div>
                                            </div>

                                            {p.blurb && (
                                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                    {p.blurb}
                                                </p>
                                            )}

                                            {tags.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {tags.slice(0, 3).map((t) => (
                                                        <Badge
                                                            key={t}
                                                            variant="secondary"
                                                            className="rounded-md px-1.5 py-0 text-[10px]"
                                                        >
                                                            {t}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            {isChecked ? (
                                                <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600/90">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Checked-in
                                                </Badge>
                                            ) : (
                                                <span />
                                            )}

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={isChecked ? 'secondary' : 'default'}
                                                    onClick={() =>
                                                        setChecked((s) => ({ ...s, [p.id]: !s[p.id] }))
                                                    }
                                                >
                                                    {isChecked ? 'Undo' : 'Check-in'}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => setOpenId(p.id)}
                                                    title="Details"
                                                >
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
                                </div>
                            </div>

                            {/* --- Mobile (stacked) --- */}
                            <div className="md:hidden">
                                <article className="mx-auto grid w-full max-w-md items-center gap-4 rounded-xl border bg-card/80 p-4 shadow-sm">
                                    <button
                                        aria-label={`Open ${p.name}`}
                                        onClick={() => setOpenId(p.id)}
                                        className="relative h-40 w-full overflow-hidden rounded-md bg-muted ring-1 ring-border"
                                    >
                                        {p.image ? (
                                            <Image
                                                src={p.image}
                                                alt={p.name}
                                                fill
                                                sizes="100vw"
                                                className="object-cover"
                                                priority={index < 2}
                                            />
                                        ) : (
                                            <div className="grid h-full w-full place-items-center text-muted-foreground">
                                                <ImageIcon className="h-5 w-5" />
                                            </div>
                                        )}
                                    </button>

                                    <div className="min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3
                                                className="truncate text-sm font-semibold"
                                                title={p.name}
                                                onClick={() => setOpenId(p.id)}
                                                role="button"
                                            >
                                                {p.name}
                                            </h3>
                                            <div className="shrink-0 text-right text-xs text-muted-foreground">
                                                {p.time ?? ''}
                                            </div>
                                        </div>

                                        {p.blurb && (
                                            <p className="mt-1 text-xs text-muted-foreground">{p.blurb}</p>
                                        )}

                                        {tags.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {tags.slice(0, 3).map((t) => (
                                                    <Badge
                                                        key={t}
                                                        variant="secondary"
                                                        className="rounded-md px-1.5 py-0 text-[10px]"
                                                    >
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-2 flex items-center justify-between gap-2">
                                        {isChecked ? (
                                            <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600/90">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Checked-in
                                            </Badge>
                                        ) : (
                                            <span />
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={isChecked ? 'secondary' : 'default'}
                                                onClick={() =>
                                                    setChecked((s) => ({ ...s, [p.id]: !s[p.id] }))
                                                }
                                            >
                                                {isChecked ? 'Undo' : 'Check-in'}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8"
                                                onClick={() => setOpenId(p.id)}
                                                title="Details"
                                            >
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {/* Details dialog */}
            <Dialog open={!!active} onOpenChange={(o) => !o && setOpenId(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{active?.name}</DialogTitle>
                        {!!active?.time && (
                            <DialogDescription>Time: {active.time}</DialogDescription>
                        )}
                    </DialogHeader>

                    {active && (
                        <div className="space-y-3">
                            <div className="relative h-44 w-full overflow-hidden rounded-md bg-muted">
                                {active.image ? (
                                    <Image
                                        src={active.image}
                                        alt={active.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 512px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                )}
                            </div>

                            {active.blurb && (
                                <p className="text-sm text-muted-foreground">{active.blurb}</p>
                            )}

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() =>
                                        setChecked((s) => ({ ...s, [active.id]: !s[active.id] }))
                                    }
                                >
                                    {checked[active.id] ? 'Undo Check-in' : 'Check-in here'}
                                </Button>
                                <DialogClose asChild>
                                    <Button variant="outline">Close</Button>
                                </DialogClose>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
