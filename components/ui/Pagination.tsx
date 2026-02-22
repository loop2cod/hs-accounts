import Link from "next/link";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
    if (totalPages <= 1) return null;

    const createPageUrl = (page: number) => {
        const url = new URL(baseUrl, "http://localhost"); // base doesn't matter for searchParams
        url.searchParams.set("page", page.toString());
        return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page=${page}`;
    };

    return (
        <div className="flex items-center justify-center gap-2 py-4">
            <Link
                href={currentPage > 1 ? createPageUrl(currentPage - 1) : "#"}
                aria-disabled={currentPage <= 1}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            >
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous Page</span>
                </Button>
            </Link>

            <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const isCurrent = page === currentPage;
                    // Show only current, 1, last, and pages around current if too many
                    if (
                        totalPages > 7 &&
                        page !== 1 &&
                        page !== totalPages &&
                        Math.abs(page - currentPage) > 1
                    ) {
                        if (page === 2 || page === totalPages - 1) {
                            return <span key={page} className="px-1 text-slate-400">...</span>;
                        }
                        return null;
                    }

                    return (
                        <Link key={page} href={createPageUrl(page)}>
                            <Button
                                variant={isCurrent ? "primary" : "outline"}
                                size="sm"
                                className={`h-8 w-8 p-0 transition-all ${isCurrent ? "shadow-md shadow-primary/20 scale-105" : ""}`}
                            >
                                {page}
                            </Button>
                        </Link>
                    );
                })}
            </div>

            <Link
                href={currentPage < totalPages ? createPageUrl(currentPage + 1) : "#"}
                aria-disabled={currentPage >= totalPages}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            >
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next Page</span>
                </Button>
            </Link>
        </div>
    );
}
