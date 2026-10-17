import { describe, expect, it } from "vitest";
import { DEFAULT_ROADMAP, nextTasks, roadmapProgress, ROADMAP_WEEKS } from "./roadmap";

const tasks = DEFAULT_ROADMAP.map((task, index) => ({
  ...task,
  id: `t${index + 1}`,
  done: index < 4,
}));

describe("DEFAULT_ROADMAP", () => {
  it("compte trois tâches par semaine, sur quatre semaines", () => {
    expect(DEFAULT_ROADMAP).toHaveLength(12);
    for (let week = 1; week <= ROADMAP_WEEKS; week += 1) {
      expect(DEFAULT_ROADMAP.filter((task) => task.week === week)).toHaveLength(3);
    }
  });

  it("garde l'espace fine avant les deux-points", () => {
    expect(DEFAULT_ROADMAP.some((task) => / :/.test(task.label))).toBe(false);
  });
});

describe("roadmapProgress", () => {
  it("compte les tâches cochées en tout et par semaine", () => {
    const progress = roadmapProgress(tasks);
    expect(progress.done).toBe(4);
    expect(progress.total).toBe(12);
    expect(progress.weeks.map(({ done }) => done)).toEqual([3, 1, 0, 0]);
    expect(progress.weeks.every(({ total }) => total === 3)).toBe(true);
  });

  it("reste à zéro sans tâche", () => {
    expect(roadmapProgress([])).toMatchObject({ done: 0, total: 0 });
  });
});

describe("nextTasks", () => {
  it("donne les trois prochaines tâches à cocher", () => {
    expect(nextTasks(tasks).map(({ id }) => id)).toEqual(["t5", "t6", "t7"]);
    expect(nextTasks(tasks.map((task) => ({ ...task, done: true })))).toEqual([]);
  });
});
