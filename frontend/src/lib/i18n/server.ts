import { cookies } from "next/headers";
import { isLang, LANG_COOKIE, makeT } from ".";

export async function getLang() {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : "ru";
}

export async function getT() {
  return makeT(await getLang());
}
