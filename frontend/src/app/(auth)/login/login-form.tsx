"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { login } from "@/lib/auth/actions";
import { useT } from "@/lib/i18n/client";

const DEMO_EMAIL = { student: "student@iitu.edu.kz", admin: "admin@iitu.edu.kz" };
type LoginRole = keyof typeof DEMO_EMAIL;

export function LoginForm({ next }: { next: string }) {
  const t = useT();
  const [state, action, pending] = useActionState(login, null);
  const [role, setRole] = useState<LoginRole>("student");
  const [email, setEmail] = useState(DEMO_EMAIL.student);

  function changeRole(r: LoginRole) {
    if (email === DEMO_EMAIL[role]) setEmail(DEMO_EMAIL[r]);
    setRole(r);
  }

  return (
    <form
      action={action}
      className="flex w-full max-w-[400px] flex-col gap-[18px] rounded-[22px] border border-line bg-surface px-7 py-8"
    >
      <div>
        <h1 className="text-[40px]">Izde</h1>
        <p className="text-muted">{t("login.lead")}</p>
      </div>
      <Field
        label={t("login.email")}
        name="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Field
        label={t("login.password")}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        defaultValue="demo-pass"
      />
      <div className="flex flex-col gap-1.5 text-sm text-muted">
        <span aria-hidden>{t("login.role")}</span>
        <Segmented
          label={t("login.role")}
          value={role}
          onChange={changeRole}
          className="w-full"
          options={[
            { value: "student", label: t("role.student") },
            { value: "admin", label: t("role.admin") },
          ]}
        />
      </div>
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="next" value={next} />
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {t("login.error")}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t("login.submit")}
      </Button>
      <p className="text-[13px] text-muted">{t("login.hint")}</p>
    </form>
  );
}
