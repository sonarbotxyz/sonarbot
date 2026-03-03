"use client";

import { useState, useMemo } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryPills } from "@/components/CategoryPills";
import { ProjectCard } from "@/components/ProjectCard";
import { TickerBar } from "@/components/TickerBar";
import { FeaturedCards } from "@/components/FeaturedCards";
import type { Project, Category } from "@/lib/mock-data";

interface HomeContentProps {
  projects: Project[];
}

export function HomeContent({ projects }: HomeContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">(
    "All"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [projects, selectedCategory, searchQuery]);

  return (
    <>
      <TickerBar projects={projects} />
      <div className="mx-auto max-w-[1400px] px-5 md:px-20">
        <HeroSection onSearch={setSearchQuery} />

      <div className="h-rule mb-8" data-label="Filter" />

      <section className="mb-8">
        <CategoryPills
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </section>

      <FeaturedCards projects={projects} />

      <div className="h-rule mb-0" data-label="Projects" />

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            No projects found
          </p>
          <p
            className="mt-1 text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            Try a different category or search term
          </p>
        </div>
      ) : (
        <div
          className="pb-16"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{
              background: "var(--border)",
              gap: "1px",
            }}
          >
            {filteredProjects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
              />
            ))}
            {/* Fill empty cells so cards don't stretch on incomplete rows */}
            {filteredProjects.length % 3 !== 0 &&
              Array.from({ length: 3 - (filteredProjects.length % 3) }).map(
                (_, i) => (
                  <div
                    key={`fill-${i}`}
                    style={{ background: "var(--bg-primary)" }}
                  />
                )
              )}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="cta-box mb-16 text-center" style={{
        border: "1px solid var(--border-strong)",
        background: `linear-gradient(135deg, var(--accent-glow) 0%, transparent 50%), var(--bg-secondary)`,
        padding: "48px 32px",
      }}>
        <h2
          className="font-display text-2xl md:text-3xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.04em" }}
        >
          Submit your project
        </h2>
        <p
          className="mt-3 text-sm max-w-md mx-auto"
          style={{ color: "var(--text-secondary)", lineHeight: "1.8" }}
        >
          Building on Base? Get discovered by the community. Our agents track
          your metrics and surface your milestones.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/submit"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 text-xs uppercase font-medium no-underline transition-colors"
            style={{
              letterSpacing: "0.06em",
              background: "var(--accent)",
              color: "#FFFFFF",
            }}
          >
            Submit Project
          </a>
          <a
            href="/upcoming"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 text-xs uppercase font-medium no-underline transition-colors"
            style={{
              letterSpacing: "0.06em",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-strong)",
            }}
          >
            View Upcoming
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
