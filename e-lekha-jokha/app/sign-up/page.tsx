"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoaded) return null;

  const update = (k: string, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signUp!.create({
        username: form.username,
        emailAddress: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });

      await signUp!.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signUp!.attemptEmailAddressVerification({ code });
      if (res.status === "complete") {
        await setActive!({ session: res.createdSessionId });
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">E-Lekha-Jokha</CardTitle>
          <CardDescription>
            {pendingVerification
              ? "Verify your email to continue"
              : "Create your account"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!pendingVerification ? (
            <form onSubmit={submit} className="space-y-3">
              <InputField label="First name" onChange={(v) => update("firstName", v)} />
              <InputField label="Last name" onChange={(v) => update("lastName", v)} />
              <InputField label="Username" onChange={(v) => update("username", v)} />
              <InputField label="Email" onChange={(v) => update("email", v)} />
              <InputField label="Password" type="password" onChange={(v) => update("password", v)} />
              <InputField label="Confirm password" type="password" onChange={(v) => update("confirmPassword", v)} />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Create account"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-3">
              <Input
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button className="w-full" disabled={loading}>
                Verify & Continue
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  onChange,
}: {
  label: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input type={type} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}
