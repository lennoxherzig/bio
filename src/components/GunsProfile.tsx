"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/config/profile";

const LTC_ADDRESS = "LenJEtFjVd8oaPUKbdBMAUSwFJ1YMPRA5A";

type DiscordPresence = {
  available: boolean;
  activity?: { image: string | null; label: string; title: string } | null;
  avatar?: string | null;
  badges?: Array<{ description: string; image: string }>;
  description?: string | null;
  displayName?: string;
  status?: "online" | "idle" | "dnd" | "offline";
  username?: string;
};

export default function GunsProfile() {
  const [entered, setEntered] = useState(false);
  const [discord, setDiscord] = useState<DiscordPresence | null>(null);
  const [discordReady, setDiscordReady] = useState(false);
  const [views, setViews] = useState<number>(profile.views);
  const [copiedLtc, setCopiedLtc] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeAnimationRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const statusText = discord?.status === "dnd"
    ? "Do Not Disturb"
    : discord?.status === "idle"
      ? "Idle"
      : discord?.status === "online"
        ? "Online"
        : "Offline";

  useEffect(() => {
    fetch("/api/views", { method: "POST", cache: "no-store" })
      .then((response) => response.json())
      .then((data: { count?: number }) => {
        if (typeof data.count === "number") setViews(data.count);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;

    const refreshDiscord = async () => {
      try {
        const response = await fetch("/api/discord", { cache: "no-store" });
        const presence = await response.json() as DiscordPresence;
        if (active) setDiscord(presence);
      } catch {
        // Keep the local fallback when the presence service is unreachable.
      } finally {
        if (active) setDiscordReady(true);
      }
    };

    void refreshDiscord();
    const timer = window.setInterval(() => void refreshDiscord(), 5_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    document.title = profile.title;
  }, []);

  useEffect(() => {
    return () => {
      if (volumeAnimationRef.current !== null) {
        window.cancelAnimationFrame(volumeAnimationRef.current);
      }
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  async function copyLitecoinAddress() {
    try {
      await navigator.clipboard.writeText(LTC_ADDRESS);
      setCopiedLtc(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedLtc(false), 1600);
    } catch {
      setCopiedLtc(false);
    }
  }

  function enter() {
    setEntered(true);
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.1;

    const startAtFortyFiveSeconds = () => {
      audio.currentTime = 45;
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      startAtFortyFiveSeconds();
    } else {
      audio.addEventListener("loadedmetadata", startAtFortyFiveSeconds, { once: true });
    }

    void audio.play().catch(() => undefined);

    const startedAt = performance.now();
    const fadeDuration = 4000;
    const fadeVolume = (now: number) => {
      const progress = Math.min((now - startedAt) / fadeDuration, 1);
      audio.volume = 0.1 + progress * 0.9;
      if (progress < 1) {
        volumeAnimationRef.current = window.requestAnimationFrame(fadeVolume);
      } else {
        volumeAnimationRef.current = null;
      }
    };

    volumeAnimationRef.current = window.requestAnimationFrame(fadeVolume);
  }

  return (
    <main className="profile-page">
      <video
        className="background-image"
        src="/Media/d8354b6b-a186-4657-9a33-4e54ffbfcf1b.mov"
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={(event) => {
          event.currentTarget.currentTime = 7;
          void event.currentTarget.play().catch(() => undefined);
        }}
        onEnded={(event) => {
          event.currentTarget.currentTime = 7;
          void event.currentTarget.play().catch(() => undefined);
        }}
      />
      <div className="background-shade" />
      <audio ref={audioRef} src="/Media/song.mp3" loop preload="auto" />

      <button
        className={`enter-screen ${entered && discordReady ? "enter-screen--hidden" : ""}`}
        type="button"
        onClick={enter}
        aria-label={profile.enterText}
      >
        {profile.enterText}
      </button>

      <section className={`profile-wrap ${entered && discordReady ? "profile-wrap--visible" : ""}`}>
        <article className="profile-card">
          <header className="identity-row">
            {discord?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="profile-avatar" src={discord.avatar} alt={discord.displayName ?? "Discord profile"} width={120} height={120} />
            ) : (
              <Image className="profile-avatar" src="/Media/avatar.jpg" alt="MrPiesel" width={120} height={120} priority />
            )}
            <div className="identity-copy">
              <div className="name-line">
                <h1>{discord?.displayName ? `@${discord.displayName}` : profile.displayName}</h1>
                <span className="premium-wrap" aria-label="Premium"><DiamondIcon /><span className="tooltip">Premium</span></span>
              </div>
              <p className="bio">{discord?.description || "Discord profile"}</p>
              <p className="joined">{profile.joined}</p>
            </div>
          </header>

          <div className="discord-presence">
            <div className="discord-avatar-wrap">
              {discord?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="discord-avatar" src={discord.avatar} alt="Discord Avatar" width={74} height={74} />
              ) : (
                <Image className="discord-avatar" src="/Media/discord-avatar.webp" alt="Discord Avatar" width={74} height={74} />
              )}
              <span className={`online-dot status-${discord?.status ?? "offline"}`} />
            </div>
            <div className="discord-copy">
              <div className="discord-name-row">
                <span className="discord-name">{discord?.username ?? "mrpiesel"}</span>
                {discord?.badges?.slice(0, 4).map((badge) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={badge.image} className="discord-badge" src={badge.image} alt={badge.description} title={badge.description} />
                ))}
              </div>
              <p className="activity-type">{discord?.activity?.label ?? "Discord status"}</p>
              <p className="activity-title">{discord?.activity?.title ?? discord?.description ?? statusText}</p>
            </div>
            {discord?.activity?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="activity-art" src={discord.activity.image} alt="" width={70} height={70} />
            ) : discord === null ? (
              <Image className="activity-art" src="/Media/activity.png" alt="" width={70} height={70} />
            ) : null}
          </div>

          <div className="social-links">
            <button className="litecoin-button" type="button" onClick={copyLitecoinAddress} aria-label="Copy Litecoin address">
              <LitecoinIcon />
              <span className={`wallet-tooltip ${copiedLtc ? "wallet-tooltip--visible" : ""}`}>{copiedLtc ? "Copied!" : "Copy LTC address"}</span>
            </button>
          </div>

          <div className="view-count"><EyeIcon /><span>{views.toLocaleString("en-US")}</span></div>
        </article>
      </section>
    </main>
  );
}

function DiamondIcon() { return <svg viewBox="23 32 465 448" aria-hidden="true"><path fill="currentColor" d="M396.31 32H264l84.19 112.26L396.31 32zm-280.62 0 48.12 112.26L248 32H115.69zM256 74.67 192 160h128l-64-85.33zm166.95-23.61L376.26 160H488L422.95 51.06zm-333.9 0L23 160h112.74L89.05 51.06zM146.68 192H24l222.8 288h.53L146.68 192zm218.64 0L264.67 480h.53L488 192H365.32zm-35.93 0H182.61L256 400l73.39-208z" /></svg>; }
function LitecoinIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor" /><path fill="#242321" d="M9.15 5.25h3.35l-1.2 4.52 2.55-.98-.63 2.38-2.55.98-1.12 4.18h6.32l-.76 2.82H5.46l1.55-5.78-2.05.79.63-2.38 2.05-.79 1.51-5.74Z" /></svg>; }
function EyeIcon() { return <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6m0 8a5 5 0 1 1 0-10 5 5 0 0 1 0 10m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5" /></svg>; }
