import { cookies } from "next/headers";
import { parseSession, SESSION_COOKIE } from "./parse";

export async function getSession() {
  return parseSession((await cookies()).get(SESSION_COOKIE)?.value);
}
