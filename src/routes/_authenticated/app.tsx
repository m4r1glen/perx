import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "@/lib/use-profile";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppGate,
});

function AppGate() {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !profile) return;
    if (!profile.onboarding_complete) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, isLoading, navigate]);

  return <Outlet />;
}
