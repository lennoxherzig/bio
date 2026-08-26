import { createHmac, randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { type NextRequest, NextResponse } from "next/server";

const STARTING_VIEWS = 3853;
const COOKIE_NAME = "cybercrimebio_visitor";
const DATA_DIRECTORY = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIRECTORY, "views.json");
const HASH_SECRET = process.env.VIEW_HASH_SECRET ?? "cybercrimebio-view-counter-v1";
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const COUNT_VIEW_SCRIPT = `
local visitorExists = redis.call('SISMEMBER', KEYS[1], ARGV[1])
local ipExists = 0
if ARGV[2] ~= '' then
  ipExists = redis.call('SISMEMBER', KEYS[1], ARGV[2])
end

if visitorExists == 0 and ipExists == 0 then
  redis.call('SADD', KEYS[1], ARGV[1])
  if ARGV[2] ~= '' then redis.call('SADD', KEYS[1], ARGV[2]) end
  return redis.call('INCR', KEYS[2])
end

redis.call('SADD', KEYS[1], ARGV[1])
if ARGV[2] ~= '' then redis.call('SADD', KEYS[1], ARGV[2]) end
return tonumber(redis.call('GET', KEYS[2]) or '0')
`;

type ViewData = {
  count: number;
  identifiers: string[];
};

let counterQueue = Promise.resolve();

function hash(value: string) {
  return createHmac("sha256", HASH_SECRET).update(value).digest("hex");
}

function visitorIp(request: NextRequest) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? null;
}

async function loadViews(): Promise<ViewData> {
  try {
    const data = JSON.parse(await readFile(DATA_FILE, "utf8")) as Partial<ViewData>;
    return {
      count: typeof data.count === "number" ? data.count : STARTING_VIEWS,
      identifiers: Array.isArray(data.identifiers) ? data.identifiers : [],
    };
  } catch {
    return { count: STARTING_VIEWS, identifiers: [] };
  }
}

async function countViewWithRedis(visitorHash: string, ipHash: string | null) {
  if (!REDIS_URL || !REDIS_TOKEN) return null;

  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      "EVAL",
      COUNT_VIEW_SCRIPT,
      2,
      "cybercrimebio:view-identifiers",
      "cybercrimebio:view-count",
      visitorHash,
      ipHash ?? "",
    ]),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });

  const payload = await response.json() as { error?: string; result?: number | string };
  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? "Redis view counter request failed");
  }

  const additionalViews = Number(payload.result ?? 0);
  return STARTING_VIEWS + (Number.isFinite(additionalViews) ? additionalViews : 0);
}

async function countView(request: NextRequest) {
  const visitorId = request.cookies.get(COOKIE_NAME)?.value ?? randomUUID();
  const visitorHash = `visitor:${hash(visitorId)}`;
  const ip = visitorIp(request);
  const ipHash = ip ? `ip:${hash(ip)}` : null;

  if (REDIS_URL && REDIS_TOKEN) {
    const count = await countViewWithRedis(visitorHash, ipHash);
    return { count: count ?? STARTING_VIEWS, visitorId };
  }

  const previous = counterQueue;
  let releaseQueue: () => void = () => {};
  counterQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });
  await previous;

  try {
    const data = await loadViews();
    const alreadyCounted = data.identifiers.includes(visitorHash)
      || (ipHash !== null && data.identifiers.includes(ipHash));

    if (!alreadyCounted) {
      data.count += 1;
      data.identifiers.push(visitorHash);
      if (ipHash) data.identifiers.push(ipHash);
      await mkdir(DATA_DIRECTORY, { recursive: true });
      await writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    }

    return { count: data.count, visitorId };
  } finally {
    releaseQueue();
  }
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let result: Awaited<ReturnType<typeof countView>>;
  try {
    result = await countView(request);
  } catch {
    result = {
      count: STARTING_VIEWS,
      visitorId: request.cookies.get(COOKIE_NAME)?.value ?? randomUUID(),
    };
  }
  const { count, visitorId } = result;
  const response = NextResponse.json({ count });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(COOKIE_NAME, visitorId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365 * 5,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
