"use server";

import { setAdminSession, logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(state: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (username === validUsername && password === validPassword) {
    await setAdminSession(username);
    redirect("/admin");
  }

  return { error: "Geçersiz kullanıcı adı veya şifre!" };
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}
