"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Authenticating..." : "Login"}
        </Button>
    );
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, null);

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="flex justify-center">
                        <img src="/logo.png" alt="HS Accounts" className="h-30 mix-blend-multiply scale-200" />
                    </div>
                    <p className="text-sm text-neutral-500">Enter PIN to access your accounts</p>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        {state?.error && (
                            <div className="rounded bg-red-50 p-2 text-sm text-center text-red-600">
                                {state.error}
                            </div>
                        )}
                        <div>
                            <Input
                                name="pin"
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Enter PIN"
                                required
                                className="text-center text-lg tracking-widest"
                                autoFocus
                            />
                        </div>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
