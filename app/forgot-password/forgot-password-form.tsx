'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    // In a real application, you would send a request to your backend here.
    // For now, we'll just simulate a success message.
    console.log("Forgot password request for:", email);
    setMessage("If an account with that email exists, you will receive a password reset link.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Forgot Password</h2>
      <p className="text-center text-sm text-muted-foreground">Enter your email to receive a password reset link.</p>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {message && <p className="text-green-500 text-sm text-center">{message}</p>}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <Button type="submit" className="w-full">Send Reset Link</Button>
    </form>
  );
}
