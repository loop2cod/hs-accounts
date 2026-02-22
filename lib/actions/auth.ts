"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PIN = "830380";
const COOKIE_NAME = "hs_auth_token";

export async function login(state: any, formData: FormData) {
    const pin = formData.get("pin");
    if (pin === PIN) {
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, "authenticated", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        });
        redirect("/");
    }
    return { error: "Invalid PIN" };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    redirect("/login");
}
