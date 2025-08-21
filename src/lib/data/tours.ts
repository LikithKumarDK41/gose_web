// src/lib/data/tours.ts

export type Place = {
    id: string;
    name: string;
    blurb?: string;
    /** Optional ETA like "09:40" */
    time?: string;
    /** Latitude (deg) */
    lat?: number;
    /** Longitude (deg) */
    lng?: number;
    /** Optional thumbnail/image URL */
    image?: string;
    /** Geofence radius in meters (small circle around the point) */
    geofenceRadius?: number;
};

export type Tour = {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    image?: string;
    tags?: string[];
    places: Place[];
};

export const tours: Tour[] = [
    {
        id: "hoskeralli",
        title: "Hosakerehalli – Micro Test Loop",
        description: "Tiny loop of very-nearby spots around your current location for quick geofence testing.",
        createdAt: "2025-02-01",
        image: "https://picsum.photos/seed/hoskeralli-test/1200/600",
        tags: ["Test", "Nearby"],
        places: [
            {
                id: "hk-0",
                name: "Entry – My Current Location (Hosakerehalli)",
                time: "09:30",
                blurb: "Start here.",
                image: "https://picsum.photos/seed/hk0-test/320/220",
                lat: 12.932924661301934,
                lng: 77.5402787066928,
                geofenceRadius: 25
            },
            {
                id: "hk-1",
                name: "Corner Tea Stall",
                time: "09:35",
                blurb: "Quick chai stop.",
                image: "https://picsum.photos/seed/hk1-test/320/220",
                lat: 12.9302528,            // ~50 m east
                lng: 77.5492105,
                geofenceRadius: 20
            },
            {
                id: "hk-2",
                name: "Small Temple",
                time: "09:40",
                blurb: "Local shrine.",
                image: "https://picsum.photos/seed/hk2-test/320/220",
                lat: 12.9307028,            // ~50 m north-east
                lng: 77.5492105,
                geofenceRadius: 20
            },
            {
                id: "hk-3",
                name: "Park Gate",
                time: "09:45",
                blurb: "Entrance to the pocket park.",
                image: "https://picsum.photos/seed/hk3-test/320/220",
                lat: 12.9307028,            // ~50 m north
                lng: 77.5487488,
                geofenceRadius: 22
            },
            {
                id: "hk-4",
                name: "Library Kiosk",
                time: "09:50",
                blurb: "Street book kiosk.",
                image: "https://picsum.photos/seed/hk4-test/320/220",
                lat: 12.9307028,            // ~50 m north-west
                lng: 77.5482871,
                geofenceRadius: 22
            },
            {
                id: "hk-5",
                name: "Lake View Point",
                time: "09:55",
                blurb: "Quick viewpoint over the lake.",
                image: "https://picsum.photos/seed/hk5-test/320/220",
                lat: 12.9293528,            // ~100 m south-west
                lng: 77.5478254,
                geofenceRadius: 30
            },
            {
                id: "hk-end",
                name: "End – Hosakerehalli",
                time: "10:00",
                blurb: "Loop ends back where you started.",
                image: "https://picsum.photos/seed/hkend-test/320/220",
                lat: 12.9302528,
                lng: 77.5487488,
                geofenceRadius: 25
            }
        ]
    },
    {
        id: "vijayanagar",
        title: "Vijayanagar City Circuit",
        description:
            "Food streets, temples, and buzzing markets in Vijayanagar. Perfect for a city day out.",
        createdAt: "2025-01-22",
        image: "https://picsum.photos/seed/vijaynagar/1200/600",
        tags: ["Urban", "Food"],
        places: [
            {
                id: "vj-1",
                name: "Vijayanagar Metro",
                time: "10:00",
                lat: 12.9591,
                lng: 77.5400,
            },
            {
                id: "vj-2",
                name: "Food Street",
                time: "10:30",
                blurb: "Snacks & chats.",
                lat: 12.9597,
                lng: 77.5409, // ~100m
            },
            {
                id: "vj-3",
                name: "Shiva Temple",
                time: "11:15",
                lat: 12.9604,
                lng: 77.5417,
            },
            {
                id: "vj-4",
                name: "Evening Bazaar",
                time: "17:00",
                blurb: "Souvenirs & tea.",
                lat: 12.9610,
                lng: 77.5425,
            },
        ],
    },
    {
        id: "south-blr",
        title: "South Bengaluru Temples & Lakes",
        description:
            "Family-friendly day exploring serene lakes and neighborhood shrines across the south.",
        createdAt: "2025-01-10",
        tags: ["Scenic", "Family"],
        places: [
            {
                id: "sb-1",
                name: "Neighborhood Lake",
                time: "09:30",
                lat: 12.9051,
                lng: 77.5850,
            },
            {
                id: "sb-2",
                name: "Hanuman Temple",
                time: "10:15",
                lat: 12.9057,
                lng: 77.5858, // ~100m
            },
            {
                id: "sb-3",
                name: "Local Cafe",
                time: "12:00",
                lat: 12.9063,
                lng: 77.5865,
            },
        ],
    },
];

export function getTourById(id: string) {
    return tours.find((t) => t.id === id);
}
