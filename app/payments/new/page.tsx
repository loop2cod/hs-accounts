import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, CreditCard } from "lucide-react";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { getCustomers } from "@/lib/actions/customers";
import { createPaymentFromForm } from "@/lib/actions/payments";

export default async function NewPaymentPage({
    searchParams,
}: {
    searchParams: Promise<{ customerId?: string }>;
}) {
    const params = await searchParams;
    const customers = await getCustomers();
    const customerId = params.customerId ?? "";

    return (
        <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Record Payment</h1>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">New Entry</p>
                </div>
                <Link href="/payments">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-500">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </Link>
            </header>

            <Card className="border-none shadow-xl shadow-slate-200/50">
                <CardHeader className="border-b border-slate-50 pb-4">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Transaction Details
                    </h2>
                </CardHeader>
                <CardContent className="pt-6">
                    <PaymentForm
                        customerId={customerId}
                        customers={customers.map((c) => ({
                            _id: c._id,
                            name: c.name,
                            shopName: c.shopName,
                        }))}
                        action={createPaymentFromForm}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
