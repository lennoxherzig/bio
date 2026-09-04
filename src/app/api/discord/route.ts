import { NextResponse } from "next/server";

const DISCORD_USER_ID = "1544060965803532340";
const GRUX_API = `https://grux.audibert.dev/user/${DISCORD_USER_ID}`;
const GRUX_ACTIVITY_API = `https://grux.audibert.dev/activity/${DISCORD_USER_ID}`;
const JAPI_USER = `https://japi.rest/discord/v1/user/${DISCORD_USER_ID}`;

type GruxResponse = {
  success: boolean;
  data?: {
    activity?: Array<{
      details?: string | null;
      largeImage?: string | null;
      name?: string | null;
      state?: string | null;
      type?: string | null;
    }>;
    profile?: {
      avatar_image?: string | null;
      badges?: Array<{
        badge_image?: string | null;
        description?: string | null;
        id?: string;
      }>;
      banner?: string | null;
      banner_image?: string | null;
      bio?: string | null;
      connected_accounts?: Array<{
        link?: string | null;
        name?: string | null;
        type?: string | null;
      }>;
      display_name?: string | null;
      username?: string | null;
    };
    spotify?: {
      album_art_url?: string | null;
      artist?: string | null;
      song?: string | null;
    } | null;
    status?: "online" | "idle" | "dnd" | "offline" | "invisible";
  };
};

type JapiResponse = {
  data?: {
    banner?: string | null;
    bannerURL?: string | null;
    id?: string;
    username?: string;
    avatarURL?: string | null;
    global_name?: string | null;
  };
};

function discordBannerUrl(hash?: string | null, fallbackUrl?: string | null) {
  if (hash) {
    const extension = hash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/banners/${DISCORD_USER_ID}/${hash}.${extension}?size=1024`;
  }

  return fallbackUrl ?? null;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const [response, activityResponse, japiResponse] = await Promise.all([
      fetch(GRUX_API, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      }).catch(() => null),
      fetch(GRUX_ACTIVITY_API, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      }).catch(() => null),
      fetch(JAPI_USER, {
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      }).catch(() => null),
    ]);

    const japiPayload = japiResponse?.ok ? ((await japiResponse.json()) as JapiResponse) : null;

    if (!response || !response.ok) {
      if (japiPayload?.data?.username) {
        return NextResponse.json({
          available: true,
          userId: DISCORD_USER_ID,
          username: japiPayload.data.username,
          displayName: japiPayload.data.global_name ?? japiPayload.data.username,
          avatar: japiPayload.data.avatarURL ?? null,
          banner: japiPayload.data.bannerURL ?? null,
          status: "offline",
          description: null,
          badges: [],
          connectedAccounts: [],
          activity: null,
          provider: "japi",
        });
      }
      return NextResponse.json({ available: false, userId: DISCORD_USER_ID });
    }

    const payload = (await response.json()) as GruxResponse;
    const data = payload.success ? payload.data : null;
    const activityPayload = (activityResponse && activityResponse.ok)
      ? ((await activityResponse.json()) as GruxResponse)
      : null;
    const liveData = activityPayload?.success ? activityPayload.data : null;
    const gruxProfile = data?.profile;

    if (!gruxProfile?.username) {
      if (japiPayload?.data?.username) {
        return NextResponse.json({
          available: true,
          userId: DISCORD_USER_ID,
          username: japiPayload.data.username,
          displayName: japiPayload.data.global_name ?? japiPayload.data.username,
          avatar: japiPayload.data.avatarURL ?? null,
          banner: japiPayload.data.bannerURL ?? null,
          status: "offline",
          description: null,
          badges: [],
          connectedAccounts: [],
          activity: null,
          provider: "japi",
        });
      }
      return NextResponse.json({ available: false, userId: DISCORD_USER_ID });
    }

    const banner = discordBannerUrl(
      gruxProfile.banner ?? japiPayload?.data?.banner,
      gruxProfile.banner_image ?? japiPayload?.data?.bannerURL,
    );

    const spotify = liveData?.spotify ?? data?.spotify;
    const activities = liveData?.activity ?? data?.activity ?? [];
    const currentActivity = activities.find((item) => item.type?.toLowerCase() !== "custom") ?? activities[0];
    const activity = spotify
      ? {
          label: "Listening to Spotify",
          title: `${spotify.song ?? "Unknown song"}${spotify.artist ? ` — ${spotify.artist}` : ""}`,
          image: spotify.album_art_url ?? null,
        }
      : currentActivity
        ? {
            label: [currentActivity.type, currentActivity.name].filter(Boolean).join(" "),
            title: currentActivity.details ?? currentActivity.state ?? currentActivity.name ?? "Active on Discord",
            image: currentActivity.largeImage ?? null,
          }
        : null;

    return NextResponse.json({
      available: true,
      userId: DISCORD_USER_ID,
      username: gruxProfile.username,
      displayName: gruxProfile.display_name ?? gruxProfile.username,
      avatar: gruxProfile.avatar_image ?? null,
      banner,
      status: (liveData?.status ?? data?.status) === "invisible" ? "offline" : liveData?.status ?? data?.status ?? "offline",
      description: gruxProfile.bio ?? null,
      badges: (gruxProfile.badges ?? []).flatMap((badge) => badge.badge_image
        ? [{ image: badge.badge_image, description: badge.description ?? badge.id ?? "Discord badge" }]
        : []),
      connectedAccounts: gruxProfile.connected_accounts ?? [],
      activity,
      provider: "grux",
    });
  } catch {
    return NextResponse.json({ available: false, userId: DISCORD_USER_ID });
  }
}
