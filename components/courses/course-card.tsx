import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Clock, Star } from "lucide-react";

export interface CourseCardData {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  level: string;
  price: number;
  sale_price: number | null;
  duration_minutes: number;
  lesson_count: number;
  rating_avg: number;
  rating_count: number;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級",
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <Card className="flex h-full flex-col overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <div className="aspect-video bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-600 p-4 text-white">
          <div className="flex flex-wrap items-center gap-2">
            {course.category && (
              <Badge variant="secondary" className="bg-white/15 text-white">
                {course.category}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/15 text-white">
              {LEVEL_LABEL[course.level] ?? course.level}
            </Badge>
          </div>
          <div className="mt-3 line-clamp-2 text-base font-semibold">
            {course.title}
          </div>
        </div>
        <CardContent className="flex flex-1 flex-col gap-2 p-4">
          {course.subtitle && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {course.subtitle}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Math.max(1, Math.round(course.duration_minutes))}分 ·{" "}
              {course.lesson_count}本
            </span>
            {course.rating_count > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {course.rating_avg.toFixed(1)} ({course.rating_count})
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between pt-1">
            {course.sale_price ? (
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-rose-600">
                  {formatCurrency(course.sale_price)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(course.price)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold">
                {formatCurrency(course.price)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
