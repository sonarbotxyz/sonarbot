"use client";

import { useState, useMemo } from "react";
import { HeroSection } from "@/components/HeroSection";
import { CategoryPills } from "@/components/CategoryPills";
import { ProjectCard } from "@/components/ProjectCard";
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

  const isFiltering = searchQuery.trim() !== "" || selectedCategory !== "All";
  const featured = projects.find((p) => p.id === "aerodrome");
  const gridProjects = isFiltering
    ? filteredProjects
    : filteredProjects.filter((p) => p.id !== "aerodrome");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <HeroSection onSearch={setSearchQuery} />

      {/* Category filter */}
      <section className="mb-5">
        <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />
      </section>

      {/* Card grid — 4 cols desktop, featured card spans 2 rows */}
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
        <div className="grid grid-cols-1 gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Featured card — first position, spans 2 rows */}
          {!isFiltering && featured && (
            <ProjectCard project={featured} featured index={0} />
          )}

          {/* Regular cards */}
          {gridProjects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={isFiltering ? i : i + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
