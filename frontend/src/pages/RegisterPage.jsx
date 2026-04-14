import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/ui/AuthCard";
import { FieldGroup } from "../components/ui/FieldGroup";
import { FormNotice } from "../components/ui/FormNotice";
import { useAuthStore } from "../store/auth.store";

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await register(form);
    setMessage("Registration complete. Continue with OTP verification.");
    navigate("/verify-registration", { state: { email: form.email } });
  };

  return (
    <AuthCard
      eyebrow="Create Account"
      title="Start with secure onboarding"
      description="Register a new AuthCore account and verify it using the email OTP flow from your backend."
      footer={
        <span>
          Already have an account?{" "}
          <Link className="font-semibold text-brand-700" to="/login">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormNotice type="success" message={message} />
        <FormNotice type="error" message={error} />
        <FieldGroup
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Aman Kumar"
        />
        <FieldGroup
          label="Email address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="aman@example.com"
        />
        <FieldGroup
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Create a strong password"
        />
        <button
          className="btn-primary w-full"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
