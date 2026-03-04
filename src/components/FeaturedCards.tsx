"use client";

import { useMemo } from "react";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/ProjectCard";

interface FeaturedCardsProps {
  projects: Project[];
}

export function FeaturedCards({ projects }: FeaturedCardsProps) {
  const featured = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const scoreA = a.healthScore ?? 0;
        const scoreB = b.healthScore ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.watchers - a.watchers;
      })
      .slice(0, 3);
  }, [projects]);

  if (featured.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="font-mono text-[13px] font-bold"
          style={{ color: "var(--accent)" }}
        >
          &gt;
        </span>
        <span
          className="text-[11px] uppercase tracking-[0.12em] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Featured
        </span>
      </div>

      {/* Cards grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ background: "var(--border)", gap: "1px" }}
      >
        {featured.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={i}
            variant="featured"
          />
        ))}
      </div>
    </section>
  );
}
