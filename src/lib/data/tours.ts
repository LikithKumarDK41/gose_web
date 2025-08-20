// src/lib/data/tours.ts
export type Place = {
    id: string;
    name: string;
    blurb?: string;
    time?: string;       // optional ETA like "09:40"
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
        title: "Hoskeralli Heritage Walk",
        description:
            "Explore calm lakes, temples, and sunset points around Hoskeralli. Gentle walk, lots of photo spots.",
        createdAt: "2025-02-01",
        image: "https://picsum.photos/seed/hoskeralli/1200/600",
        tags: ["Culture", "Easy"],
        places: [
            { id: "hk-1", name: "Hoskeralli Lake View", time: "09:40", blurb: "Birds & calm waters.", image: "https://picsum.photos/seed/hk1/320/220", },
            { id: "hk-2", name: "Temple Street", time: "09:55", blurb: "Local shrine & markets.", image: "https://picsum.photos/seed/hk2/320/220", },
            { id: "hk-3", name: "Old Banyan Circle", time: "10:20", blurb: "Iconic meeting spot.", image: "https://picsum.photos/seed/hk1/320/220", },
            { id: "hk-4", name: "Sunset Ridge", time: "11:00", blurb: "Golden‑hour viewpoint.", image: "https://picsum.photos/seed/hk4/320/220", },
        ],
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
            { id: "vj-1", name: "Vijayanagar Metro", time: "10:00" },
            { id: "vj-2", name: "Food Street", time: "10:30", blurb: "Snacks & chats." },
            { id: "vj-3", name: "Shiva Temple", time: "11:15" },
            { id: "vj-4", name: "Evening Bazaar", time: "17:00", blurb: "Souvenirs & tea." },
        ],
    },
    {
        id: "south-blr",
        title: "South Bengaluru Temples & Lakes",
        description:
            "Family‑friendly day exploring serene lakes and neighborhood shrines across the south.",
        createdAt: "2025-01-10",
        tags: ["Scenic", "Family"],
        places: [
            { id: "sb-1", name: "Neighborhood Lake", time: "09:30" },
            { id: "sb-2", name: "Hanuman Temple", time: "10:15" },
            { id: "sb-3", name: "Local Cafe", time: "12:00" },
        ],
    },
];

export function getTourById(id: string) {
    return tours.find(t => t.id === id);
}
