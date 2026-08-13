"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { identifyUser, resetUser } from "@/lib/analytics";

export function PostHogIdentify() {
  const { data: session, status } = useSession();
  const identifiedId = useRef<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session.user.id) {
      if (identifiedId.current !== session.user.id) {
        identifyUser(session.user.id, {
          email: session.user.email ?? undefined,
          name: session.user.name ?? undefined,
        });
        identifiedId.current = session.user.id;
      }
    } else if (status === "unauthenticated" && identifiedId.current) {
      resetUser();
      identifiedId.current = null;
    }
  }, [status, session?.user?.id, session?.user?.email, session?.user?.name]);

  return null;
}
