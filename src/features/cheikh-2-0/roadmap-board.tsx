"use client";

import { RotateCcw } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { Progress } from "@/components/ui/progress";
import { roadmapProgress, ROADMAP_WEEKS, type RoadmapItem } from "@/lib/cheikh/roadmap";
import { resetRoadmapTasks, toggleRoadmapTask } from "./actions";

type RoadmapBoardProps = {
  tasks: RoadmapItem[];
  copy: {
    /** « {done} / {total} tâches ». */
    progress: string;
    reset: string;
    weeks: ReadonlyArray<{ label: string; title: string }>;
  };
};

/**
 * La feuille de route : une case cochée s'affiche tout de suite, puis la base suit.
 * Si l'enregistrement échoue, la page relue remet la case dans son vrai état.
 */
export function RoadmapBoard({ tasks, copy }: RoadmapBoardProps) {
  const [optimistic, setDone] = useOptimistic(
    tasks,
    (current, change: { id: string; done: boolean }) =>
      current.map((task) => (task.id === change.id ? { ...task, done: change.done } : task)),
  );
  const [, start] = useTransition();
  const progress = roadmapProgress(optimistic);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Progress
          current={progress.done}
          total={Math.max(progress.total, 1)}
          label={copy.progress
            .replace("{done}", String(progress.done))
            .replace("{total}", String(progress.total))}
          className="min-w-0 flex-[1_1_16rem]"
        />
        <form action={resetRoadmapTasks}>
          <button type="submit" className={buttonClasses("secondary")}>
            <RotateCcw size={20} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
            {copy.reset}
          </button>
        </form>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: ROADMAP_WEEKS }, (_, index) => {
          const week = copy.weeks[index];
          const titleId = `semaine-${index + 1}`;
          return (
            <article
              key={index}
              aria-labelledby={titleId}
              className="flex flex-col gap-3 rounded-sheet border-[1.5px] border-ink bg-sheet p-5"
            >
              <header className="flex flex-col gap-0.5">
                <p className="meta text-stamp-strong">{week?.label}</p>
                <h3 id={titleId} className="font-display text-[1.0625rem] font-semibold">
                  {week?.title}
                </h3>
              </header>
              <ul className="flex flex-col gap-1">
                {optimistic
                  .filter((task) => task.week === index + 1)
                  .map((task) => (
                    <li key={task.id}>
                      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={(event) => {
                            const done = event.target.checked;
                            start(async () => {
                              setDone({ id: task.id, done });
                              await toggleRoadmapTask(task.id, done);
                            });
                          }}
                          className="mt-1 size-5 shrink-0 accent-(--stamp-strong)"
                        />
                        <span className={task.done ? "text-ink-soft line-through" : undefined}>
                          {task.label}
                        </span>
                      </label>
                    </li>
                  ))}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
