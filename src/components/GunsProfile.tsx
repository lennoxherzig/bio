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
  banner?: string | null;
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
  const [bannerFailed, setBannerFailed] = useState(false);
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
        if (active) {
          setDiscord(presence);
          setBannerFailed(false);
        }
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

          <div className={`discord-presence${discord?.banner && !bannerFailed ? " discord-presence--banner" : ""}`}>
            {discord?.banner && !bannerFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="discord-banner"
                src={discord.banner}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setBannerFailed(true)}
              />
            ) : null}
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
            <a
              className="discord-button"
              href={profile.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join Discord"
            >
              <DiscordIcon />
              <span className="wallet-tooltip">Discord</span>
            </a>
          </div>

          <div className="view-count"><EyeIcon /><span>{views.toLocaleString("en-US")}</span></div>
        </article>
      </section>
    </main>
  );
}

function DiamondIcon() { return <svg viewBox="23 32 465 448" aria-hidden="true"><path fill="currentColor" d="M396.31 32H264l84.19 112.26L396.31 32zm-280.62 0 48.12 112.26L248 32H115.69zM256 74.67 192 160h128l-64-85.33zm166.95-23.61L376.26 160H488L422.95 51.06zm-333.9 0L23 160h112.74L89.05 51.06zM146.68 192H24l222.8 288h.53L146.68 192zm218.64 0L264.67 480h.53L488 192H365.32zm-35.93 0H182.61L256 400l73.39-208z" /></svg>; }
function LitecoinIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor" /><path fill="#242321" d="M9.15 5.25h3.35l-1.2 4.52 2.55-.98-.63 2.38-2.55.98-1.12 4.18h6.32l-.76 2.82H5.46l1.55-5.78-2.05.79.63-2.38 2.05-.79 1.51-5.74Z" /></svg>; }
function DiscordIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>; }
function EyeIcon() { return <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6m0 8a5 5 0 1 1 0-10 5 5 0 0 1 0 10m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5" /></svg>; }
