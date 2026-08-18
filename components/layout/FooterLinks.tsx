import { BookOpen } from "lucide-react";
import { SiGithub } from "react-icons/si";

import { REPO_URL } from "@/lib/github";

export function FooterLinks() {
  return (
    <nav className="flex items-center gap-6">
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        <SiGithub className="size-4" />
        GitHub
      </a>
      <a
        href={`${REPO_URL}#readme`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        <BookOpen className="size-4" />
        Docs
      </a>
    </nav>
  );
}
