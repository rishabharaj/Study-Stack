"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, BookOpen, Layers, StickyNote, Link2 } from "lucide-react";

type SearchResult = {
  type: "subject" | "topic" | "subtopic" | "note" | "resource";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

const typeIcons = {
  subject: BookOpen,
  topic: Layers,
  subtopic: Layers,
  note: StickyNote,
  resource: Link2,
};

const typeColors = {
  subject: "text-violet-400",
  topic: "text-blue-400",
  subtopic: "text-cyan-400",
  note: "text-amber-400",
  resource: "text-green-400",
};

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(() => {
      searchAll(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  async function searchAll(q: string) {
    setLoading(true);
    const supabase = createClient();
    const like = `%${q}%`;

    const [subjectsRes, topicsRes, subtopicsRes, notesRes, resourcesRes] = await Promise.all([
      supabase.from("subjects").select("id, name, icon").ilike("name", like).limit(5),
      supabase.from("topics").select("id, name, subjects(name)").ilike("name", like).limit(5),
      supabase.from("subtopics").select("id, name, topics(name)").ilike("name", like).limit(5),
      supabase.from("notes").select("id, title, content, topics(name)").or(`title.ilike.${like},content.ilike.${like}`).limit(5),
      supabase.from("resources").select("id, title, url, type").ilike("title", like).limit(5),
    ]);

    const all: SearchResult[] = [
      ...(subjectsRes.data || []).map((s: any) => ({
        type: "subject" as const,
        id: s.id,
        title: `${s.icon} ${s.name}`,
        subtitle: "Subject",
        href: `/subjects/${s.id}`,
      })),
      ...(topicsRes.data || []).map((t: any) => ({
        type: "topic" as const,
        id: t.id,
        title: t.name,
        subtitle: t.subjects?.name || "Topic",
        href: `/topics/${t.id}`,
      })),
      ...(subtopicsRes.data || []).map((st: any) => ({
        type: "subtopic" as const,
        id: st.id,
        title: st.name,
        subtitle: st.topics?.name || "Subtopic",
        href: "#",
      })),
      ...(notesRes.data || []).map((n: any) => ({
        type: "note" as const,
        id: n.id,
        title: n.title,
        subtitle: n.topics?.name || "Note",
        href: "/notes",
      })),
      ...(resourcesRes.data || []).map((r: any) => ({
        type: "resource" as const,
        id: r.id,
        title: r.title,
        subtitle: r.type,
        href: r.url,
      })),
    ];

    setResults(all);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SearchIcon className="w-6 h-6 text-primary" />
          Search
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search across subjects, topics, notes, and resources
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search..."
          className="pl-12 h-14 text-lg rounded-2xl bg-background/50 border-border/50"
          autoFocus
        />
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-shimmer" />
          ))}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-16 glass-card rounded-2xl">
          <SearchIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => {
            const Icon = typeIcons[result.type];
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => {
                  if (result.href.startsWith("http")) {
                    window.open(result.href, "_blank");
                  } else if (result.href !== "#") {
                    router.push(result.href);
                  }
                }}
                className="w-full flex items-center gap-4 p-4 glass-card rounded-xl hover:bg-accent/50 transition-all text-left group"
              >
                <Icon className={`w-5 h-5 ${typeColors[result.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                    {result.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                </div>
                <Badge variant="outline" className="text-[10px] rounded-full capitalize">
                  {result.type}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
