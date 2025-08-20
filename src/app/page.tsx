// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, MapPinned, Clock3, Star, Plane, ListChecks, ArrowRight } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back 👋</h1>
          <p className="text-muted-foreground">
            Plan routes, manage trips, and keep your saved places organized.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/tour">
              Create Itinerary
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin">Manage Areas</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Upcoming Trips"
          value="3"
          hint="+1 this month"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          title="Saved Places"
          value="42"
          hint="8 new"
          icon={<MapPinned className="h-4 w-4" />}
        />
        <StatCard
          title="Hours Planned"
          value="67h"
          hint="across all trips"
          icon={<Clock3 className="h-4 w-4" />}
        />
        <StatCard
          title="Favorites"
          value="15"
          hint="highly rated"
          icon={<Star className="h-4 w-4" />}
        />
      </div>

      {/* Main two‑column content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Your Itineraries</CardTitle>
              <Tabs defaultValue="active" className="w-auto">
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                </TabsList>
                <TabsContent value="active" />
                <TabsContent value="drafts" />
              </Tabs>
            </CardHeader>
            <CardContent className="space-y-3">
              <ItineraryRow
                title="Katsuragi Kodo Road"
                days="1 day"
                stops={16}
                progress={78}
                badge="Japan"
              />
              <Separator />
              <ItineraryRow
                title="Nara Heritage Walk"
                days="Half‑day"
                stops={9}
                progress={45}
                badge="Japan"
              />
              <Separator />
              <ItineraryRow
                title="Kyoto Temples Circuit"
                days="2 days"
                stops={24}
                progress={22}
                badge="Japan"
              />
              <div className="pt-2">
                <Button variant="ghost" className="gap-2" asChild>
                  <Link href="/tour">
                    View all itineraries <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ActivityItem
                title="Added 'Emperor Jinmu Shrine' to favorites"
                time="2h ago"
                who="N"
              />
              <ActivityItem
                title="Created new area 'Kashihara Stations'"
                time="5h ago"
                who="N"
              />
              <ActivityItem
                title="Reordered stops in 'Kodo Road'"
                time="yesterday"
                who="N"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <p className="text-xs text-muted-foreground">Jump back in</p>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="secondary" className="justify-start gap-2" asChild>
                <Link href="/tour"><ListChecks className="h-4 w-4" /> Resume planning</Link>
              </Button>
              <Button variant="secondary" className="justify-start gap-2" asChild>
                <Link href="/admin"><MapPinned className="h-4 w-4" /> Manage geofences</Link>
              </Button>
              <Button variant="secondary" className="justify-start gap-2" asChild>
                <Link href="/"><Plane className="h-4 w-4" /> Import sample trip</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Saved Places (nearby)</CardTitle>
              <p className="text-xs text-muted-foreground">Based on your last position</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <PlaceRow name="Emperor Jinmu Shrine" tag="Shrine" rating="4.7" />
              <PlaceRow name="Hohoma Shrine" tag="Shrine" rating="4.5" />
              <PlaceRow name="Kisshosoji Temple" tag="Temple" rating="4.6" />
              <div className="pt-1">
                <Button variant="ghost" className="gap-2" asChild>
                  <Link href="/tour">See all places <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Announcement
                title="New: Dark mode & language toggle"
                blurb="Switch between light/dark and EN/JP from the header."
              />
              <Announcement
                title="PWA install"
                blurb="Add the app to your home screen for an offline‑friendly experience."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- small pieces ---------- */

function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ItineraryRow({
  title,
  days,
  stops,
  progress,
  badge,
}: {
  title: string;
  days: string;
  stops: number;
  progress: number;
  badge: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{title}</span>
          <Badge variant="secondary" className="whitespace-nowrap">{badge}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{days} • {stops} stops</p>
        <div className="mt-2">
          <Progress value={progress} className="h-2" />
        </div>
      </div>
      <Button variant="outline" size="sm" className="mt-2 sm:mt-0" asChild>
        <Link href="/tour">Open</Link>
      </Button>
    </div>
  );
}

function ActivityItem({ title, time, who }: { title: string; time: string; who: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage alt="user" />
        <AvatarFallback>{who}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function PlaceRow({ name, tag, rating }: { name: string; tag: string; rating: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{tag}</div>
      </div>
      <Badge variant="outline">{rating}★</Badge>
    </div>
  );
}

function Announcement({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="font-medium">{title}</div>
      <p className="text-sm text-muted-foreground">{blurb}</p>
    </div>
  );
}
