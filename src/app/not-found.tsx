import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex h-full flex-col items-center justify-center py-24 text-center">
            <h1 className="text-3xl font-semibold">404 — Page not found</h1>
            <p className="mt-2 text-muted-foreground">
                The page you’re looking for doesn’t exist.
            </p>
            <Link
                href="/"
                className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
                Go Home
            </Link>
        </div>
    );
}
