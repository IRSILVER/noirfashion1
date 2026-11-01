"use client";
import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="a-card mt-8 space-y-5 p-7">
      <div>
        <label htmlFor="email" className="a-label">E-mailadres</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="a-input" />
      </div>
      <div>
        <label htmlFor="password" className="a-label">Wachtwoord</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="a-input" />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-800">{state.error}</p>}
      <button type="submit" disabled={pending} className="a-btn a-btn-dark w-full">{pending ? "Bezig met inloggen…" : "Inloggen"}</button>
    </form>
  );
}
