"use client";

import { useState, useMemo } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryPills } from "@/components/CategoryPills";
import { ProjectCard } from "@/components/ProjectCard";
import { Sidebar } from "@/components/Sidebar";
import { projects, type Category } from "@/lib/mock-data";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");
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
  }, [selectedCategory, searchQuery]);

  const featured = projects.find((p) => p.id === "aerodrome");
  const gridProjects = filteredProjects.filter((p) => p.id !== "aerodrome");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <HeroSection onSearch={setSearchQuery} />

      {/* Featured project */}
      {!searchQuery && selectedCategory === "All" && featured && (
        <section className="mb-12">
          <ProjectCard project={featured} featured index={0} />
        </section>
      )}

      {/* Category filter */}
      <section className="mb-10">
        <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
      </section>

      {/* Main grid + sidebar */}
      <div className="flex gap-8 pb-16">
        {/* Card grid */}
        <div className="min-w-0 flex-1">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium text-text-secondary">
                No projects found
              </p>
              <p className="mt-1 text-sm text-text-tertiary">
                Try a different category or search term
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(searchQuery || selectedCategory !== "All"
                ? filteredProjects
                : gridProjects
              ).map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
