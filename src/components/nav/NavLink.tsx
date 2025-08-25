// src/components/nav/NavLink.tsx
"use client";
import Link from "next/link";
import { useGlobalLoader } from "@/providers/LoaderProvider";

type Props = React.ComponentProps<typeof Link>;
export default function NavLink({ onClick, ...props }: Props) {
    const { show } = useGlobalLoader();
    return (
        <Link
            {...props}
            onClick={(e) => {
                onClick?.(e);
                show();
            }}
        />
    );
}
