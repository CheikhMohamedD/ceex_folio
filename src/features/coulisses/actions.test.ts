// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Niveau 3 de la défense : chaque Server Action des Coulisses commence par
 * requireOwner(). Sans propriétaire, elle s'arrête là, avant toute lecture ou écriture
 * en base, quel que soit ce qu'on lui envoie.
 */
const requireOwner = vi.fn();
const writes = vi.fn();

vi.mock("@/server/owner", () => ({ requireOwner }));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/server/repositories/client-requests.repo", () => ({
  setClientRequestStatus: writes,
}));
vi.mock("@/server/repositories/cheikh.repo", () => ({
  createFramingSheet: writes,
  parkFramingSheet: writes,
  resetRoadmap: writes,
  setRoadmapTask: writes,
}));
vi.mock("@/server/repositories/compass.repo", () => ({
  createCompassProject: writes,
  createDream: writes,
  deleteCompassProject: writes,
  deleteDream: writes,
  setActiveCompassProject: writes,
  updateCompassProject: writes,
}));

const ID = "cmvd05ggg00027p7d8nwnqqzm";
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
};

const inbox = await import("../inbox/actions");
const cheikh = await import("../cheikh-2-0/actions");
const compass = await import("../compass/actions");

/** Un appel valide de chaque action : seul le propriétaire manque. */
const CALLS: Array<[string, () => Promise<unknown>]> = [
  ["changeRequestStatus", () => inbox.changeRequestStatus(null, form({ id: ID, status: "WON" }))],
  ["toggleRoadmapTask", () => cheikh.toggleRoadmapTask(ID, true)],
  ["resetRoadmapTasks", () => cheikh.resetRoadmapTasks()],
  [
    "saveFramingSheet",
    () =>
      cheikh.saveFramingSheet({
        goal: "Un écran",
        problem: "Du papier",
        audience: "Un gérant",
        context: "Au poulailler",
        constraints: "Hors ligne",
        successCriterion: "7 jours de suite",
        gateName: "",
        gateAnswers: [true, true, true, true],
      }),
  ],
  ["parkSheetInCompass", () => cheikh.parkSheetInCompass(form({ id: ID }))],
  [
    "addDream",
    () => compass.addDream(null, form({ title: "Un rêve", description: "", horizon: "3Y" })),
  ],
  ["removeDream", () => compass.removeDream(form({ id: ID }))],
  [
    "saveProject",
    () =>
      compass.saveProject(
        null,
        form({
          id: "",
          title: "Atelier",
          feasibilityScore: "3",
          impactScore: "5",
          itilStep: "4",
          dreamId: "",
        }),
      ),
  ],
  ["makeProjectActive", () => compass.makeProjectActive(form({ id: ID }))],
  ["removeProject", () => compass.removeProject(form({ id: ID }))],
];

beforeEach(() => {
  requireOwner.mockReset();
  writes.mockReset();
});

describe("Server Actions des Coulisses", () => {
  it("couvrent toutes les actions exportées", () => {
    const exported = [inbox, cheikh, compass].flatMap((module) =>
      Object.entries(module)
        .filter(([, value]) => typeof value === "function")
        .map(([name]) => name),
    );
    expect(CALLS.map(([name]) => name).sort()).toEqual(exported.sort());
  });

  it.each(CALLS)("%s s'arrête sans propriétaire, avant la base", async (_, call) => {
    requireOwner.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(call()).rejects.toThrow("NEXT_REDIRECT");
    expect(requireOwner).toHaveBeenCalledOnce();
    expect(writes).not.toHaveBeenCalled();
  });

  it.each(CALLS)("%s écrit pour le propriétaire", async (_, call) => {
    requireOwner.mockResolvedValue({ id: "owner", name: "Cheikh", image: null });
    writes.mockResolvedValue({ id: ID });
    await call();
    expect(writes).toHaveBeenCalled();
  });

  it("recalcule le verdict du sas au lieu de le croire", async () => {
    requireOwner.mockResolvedValue({ id: "owner", name: "Cheikh", image: null });
    writes.mockResolvedValue({ id: ID });
    await cheikh.saveFramingSheet({
      goal: "Un écran",
      problem: "Du papier",
      audience: "Un gérant",
      context: "Au poulailler",
      constraints: "Hors ligne",
      successCriterion: "7 jours de suite",
      gateName: "",
      gateAnswers: [false, true, true, true],
      verdict: "GO",
    });
    expect(writes).toHaveBeenCalledWith(
      expect.objectContaining({ verdict: "PARK", gateName: null }),
    );
  });

  it("refuse une fiche incomplète", async () => {
    requireOwner.mockResolvedValue({ id: "owner", name: "Cheikh", image: null });
    const result = await cheikh.saveFramingSheet({ goal: "Un écran", gateAnswers: [] });
    expect(result).toEqual({ ok: false });
    expect(writes).not.toHaveBeenCalled();
  });
});
