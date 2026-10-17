import { describe, expect, it, vi } from "vitest";
import type {
  ClientRequestRepo,
  NewClientRequest,
} from "@/server/repositories/client-requests.repo";
import { RATE_LIMIT, rateLimitFrom, submitDirect, submitGuided, type ContactDeps } from "./service";

function fakeRepo(recent = 0) {
  const created: NewClientRequest[] = [];
  const repo: ClientRequestRepo = {
    create: vi.fn(async (data: NewClientRequest) => {
      created.push(data);
      return { id: `r${created.length}` };
    }),
    countSince: vi.fn(async () => recent),
  };
  return { repo, created };
}

function deps(overrides: Partial<ContactDeps> = {}): ContactDeps {
  return {
    repo: fakeRepo().repo,
    verifyCaptcha: async () => true,
    notify: async () => {},
    ipHash: "a".repeat(64),
    now: () => new Date("2026-10-17T12:00:00Z"),
    ...overrides,
  };
}

const direct = {
  values: {
    name: "Awa",
    email: "awa@example.sn",
    whatsapp: "",
    message: "Un site pour ma boutique.",
  },
  honeypot: "",
  locale: "fr",
};

const guided = {
  values: {
    projectType: "site",
    goal: "Une boutique en ligne pour vendre nos tissus wax et livrer à domicile.",
    problem: "",
    audience: "Nos clientes",
    context: "",
    constraints: "",
    budgetRange: "500k-2m",
    deadline: "unknown",
    successCriterion: "",
    name: "Awa",
    email: "",
    whatsapp: "+221 77 123 45 67",
  },
  honeypot: "",
  locale: "en",
};

describe("submitDirect", () => {
  it("enregistre la demande avec la langue et l'empreinte IP, puis prévient", async () => {
    const { repo, created } = fakeRepo();
    const notify = vi.fn(async () => {});
    expect(await submitDirect(deps({ repo, notify }), direct)).toEqual({ ok: true });
    expect(created[0]).toMatchObject({
      channel: "DIRECT",
      locale: "fr",
      name: "Awa",
      email: "awa@example.sn",
      message: "Un site pour ma boutique.",
      ipHash: "a".repeat(64),
    });
    expect(created[0]?.whatsapp).toBeUndefined();
    expect(notify).toHaveBeenCalledWith(created[0]);
  });

  it("répond comme d'habitude à un robot, sans rien enregistrer", async () => {
    const { repo, created } = fakeRepo();
    expect(await submitDirect(deps({ repo }), { ...direct, honeypot: "spam" })).toEqual({
      ok: true,
    });
    expect(created).toHaveLength(0);
  });

  it("renvoie les erreurs de chaque champ avant toute vérification", async () => {
    const verifyCaptcha = vi.fn(async () => true);
    const outcome = await submitDirect(deps({ verifyCaptcha }), {
      ...direct,
      values: { ...direct.values, name: "" },
    });
    expect(outcome).toEqual({ ok: false, fieldErrors: { name: "required" } });
    expect(verifyCaptcha).not.toHaveBeenCalled();
  });

  it("refuse un jeton Turnstile invalide", async () => {
    const outcome = await submitDirect(deps({ verifyCaptcha: async () => false }), direct);
    expect(outcome).toEqual({ ok: false, fieldErrors: {}, formError: "captcha" });
  });

  it(`bloque le ${RATE_LIMIT.max + 1}e envoi de l'heure depuis une même adresse`, async () => {
    const { repo, created } = fakeRepo(RATE_LIMIT.max);
    const outcome = await submitDirect(deps({ repo }), direct);
    expect(outcome).toEqual({ ok: false, fieldErrors: {}, formError: "rateLimited" });
    expect(repo.countSince).toHaveBeenCalledWith("a".repeat(64), new Date("2026-10-17T11:00:00Z"));
    expect(created).toHaveLength(0);
  });

  it("annonce un formulaire non branché quand aucun stockage n'est configuré", async () => {
    expect(await submitDirect(deps({ repo: null }), direct)).toEqual({
      ok: false,
      fieldErrors: {},
      formError: "unavailable",
    });
  });

  it("garde la demande quand l'email échoue", async () => {
    const { repo, created } = fakeRepo();
    const notify = vi.fn(async () => {
      throw new Error("Resend indisponible");
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await submitDirect(deps({ repo, notify }), direct)).toEqual({ ok: true });
    expect(created).toHaveLength(1);
    error.mockRestore();
  });
});

describe("rateLimitFrom", () => {
  it("lit un entier positif, sinon garde la limite de la doc", () => {
    expect(rateLimitFrom("20")).toBe(20);
    expect(rateLimitFrom(undefined)).toBe(RATE_LIMIT.max);
    expect(rateLimitFrom("0")).toBe(RATE_LIMIT.max);
    expect(rateLimitFrom("deux")).toBe(RATE_LIMIT.max);
  });

  it("s'applique à la place de la limite par défaut", async () => {
    const { repo } = fakeRepo(RATE_LIMIT.max);
    expect(await submitDirect(deps({ repo, rateLimit: 50 }), direct)).toEqual({ ok: true });
  });
});

describe("submitGuided", () => {
  it("enregistre les réponses avec leur score de qualification", async () => {
    const { repo, created } = fakeRepo();
    expect(await submitGuided(deps({ repo }), guided)).toEqual({ ok: true });
    expect(created[0]).toMatchObject({
      channel: "GUIDED",
      locale: "en",
      projectType: "site",
      budgetRange: "500k-2m",
      deadline: "unknown",
      qualificationScore: 2,
    });
  });
});
