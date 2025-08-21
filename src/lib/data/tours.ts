// src/lib/data/tours.ts
export type Place = {
    id: string;
    name: string;
    blurb?: string;
    time?: string; // optional ETA like "09:40"
    lat?: number;
    lng?: number;
    image?: string;
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
        title: "Hosakerehalli Heritage Walk",
        description:
            "Explore calm lakes, temples, and sunset points around Hosakerehalli. Gentle walk, lots of photo spots.",
        createdAt: "2025-02-01",
        image: "https://picsum.photos/seed/hoskeralli/1200/600",
        tags: ["Culture", "Easy"],
        places: [
            {
                id: "hk-0",
                name: "Entry – My Current Location (Hosakerehalli)",
                time: "09:30",
                blurb: "Starting point of the walk.",
                image: "https://picsum.photos/seed/hk0/320/220",
                lat: 12.9369,
                lng: 77.5412,
            },
            {
                id: "hk-1",
                name: "Hosakerehalli Lake View",
                time: "09:40",
                blurb: "Birds & calm waters.",
                image: "https://picsum.photos/seed/hk1/320/220",
                lat: 12.9380,
                lng: 77.5418,
            },
            {
                id: "hk-2",
                name: "Temple Street",
                time: "09:55",
                blurb: "Local shrine & markets.",
                image: "https://picsum.photos/seed/hk2/320/220",
                lat: 12.9390,
                lng: 77.5430,
            },
            {
                id: "hk-3",
                name: "Old Banyan Circle",
                time: "10:10",
                blurb: "Iconic meeting spot under a banyan tree.",
                image: "https://picsum.photos/seed/hk3/320/220",
                lat: 12.9374,
                lng: 77.5438,
            },
            {
                id: "hk-4",
                name: "Sunset Ridge",
                time: "10:30",
                blurb: "Golden-hour viewpoint.",
                image: "https://picsum.photos/seed/hk4/320/220",
                lat: 12.9359,
                lng: 77.5447,
            },
            {
                id: "hk-5",
                name: "Hosakerehalli Park",
                time: "10:45",
                blurb: "Green space with benches and playground.",
                image: "https://picsum.photos/seed/hk5/320/220",
                lat: 12.9349,
                lng: 77.5436,
            },
            {
                id: "hk-6",
                name: "Lakeside Cafe",
                time: "11:00",
                blurb: "Tea and snacks by the water.",
                image: "https://picsum.photos/seed/hk6/320/220",
                lat: 12.9355,
                lng: 77.5410,
            },
            {
                id: "hk-7",
                name: "Heritage Well",
                time: "11:20",
                blurb: "Historic stepwell still used by locals.",
                image: "https://picsum.photos/seed/hk7/320/220",
                lat: 12.9363,
                lng: 77.5398,
            },
            {
                id: "hk-8",
                name: "Crafts Market",
                time: "11:40",
                blurb: "Handmade souvenirs and local art.",
                image: "https://picsum.photos/seed/hk8/320/220",
                lat: 12.9378,
                lng: 77.5390,
            },
            {
                id: "hk-9",
                name: "Community Library",
                time: "12:00",
                blurb: "Old community library with archives.",
                image: "https://picsum.photos/seed/hk9/320/220",
                lat: 12.9386,
                lng: 77.5402,
            },
            {
                id: "hk-10",
                name: "Garden Temple",
                time: "12:20",
                blurb: "Peaceful shrine surrounded by gardens.",
                image: "https://picsum.photos/seed/hk10/320/220",
                lat: 12.9394,
                lng: 77.5424,
            },
            {
                id: "hk-end",
                name: "End – Hosakerehalli",
                time: "12:40",
                blurb: "Loop ends back at the entry point.",
                image: "https://picsum.photos/seed/hkend/320/220",
                lat: 12.9369,
                lng: 77.5412,
            },
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
