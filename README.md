# Guns.lol Style Bio Page

A high-performance Next.js bio link page inspired by Guns.lol featuring live Discord presence, custom emoji rendering, background video/image support, click-to-enter audio playback, and a persistent view counter.

---

## 📑 Table of Contents
- [1. Discord Profile & Presence Setup](#1-discord-profile--presence-setup)
  - [Changing Your Discord ID](#changing-your-discord-id)
  - [Live Rich Presence & Status (Grux)](#live-rich-presence--status-grux)
  - [Custom Discord Emojis](#custom-discord-emojis)
- [2. Background Music & Equalizer](#2-background-music--equalizer)
  - [Downloading Audio from YouTube](#downloading-audio-from-youtube)
  - [Applying the Custom 6-Band Equalizer (EQ)](#applying-the-custom-6-band-equalizer-eq)
- [3. Background Media & Customization](#3-background-media--customization)
  - [Media Files in `public/Media/`](#media-files-in-publicmedia)
  - [Text & Profile Config (`src/config/profile.ts`)](#text--profile-config-srcconfigprofilets)
- [4. Local Development](#4-local-development)
- [5. Deployment (Vercel)](#5-deployment-vercel)

---

## 1. Discord Profile & Presence Setup

The application dynamically fetches your Discord username, display name, avatar, banner, badges, status, and bio.

### Changing Your Discord ID
1. Enable **Developer Mode** in Discord (`Settings` → `Advanced` → `Developer Mode`).
2. Right-click your Discord avatar / profile in Discord and select **Copy User ID**.
3. Open [`src/app/api/discord/route.ts`](src/app/api/discord/route.ts).
4. Update the `DISCORD_USER_ID` constant on line 3:
   ```ts
   const DISCORD_USER_ID = "YOUR_DISCORD_USER_ID";
   ```
5. Save the file. The app will immediately start fetching your user details.

### Live Rich Presence & Status (Grux)
- The profile uses the **Grux API** for real-time rich presence (playing games, Spotify activity, DND/idle/online status).
- Grux monitors members inside its Discord server. To have your live presence actively monitored:
  👉 Join the Grux Discord: [https://discord.gg/8j3bHRhSVp](https://discord.gg/8j3bHRhSVp)
- **Automatic Fallback (Japi)**: If you are not in the server or Grux is temporarily down, the app automatically falls back to **Japi** to pull your avatar, global display name, and username directly from Discord.

### Custom Discord Emojis
If your Discord bio contains custom server emojis (such as `<:emoji_name:1543090461474820098>` or animated `<a:emoji_name:id>`), the app automatically:
- Parses the emoji snowflake IDs via regex.
- Converts them into Discord CDN image URLs (`https://cdn.discordapp.com/emojis/{id}.webp?size=48&quality=lossless`).
- Aligns and scales them inline with `.discord-custom-emoji` in `src/app/globals.css`.

---

## 2. Background Music & Equalizer

When visitors click anywhere on the enter screen, the background audio (`public/Media/song.mp3`) starts playing automatically on loop.

### Downloading Audio from YouTube
Using `yt-dlp` and `ffmpeg`:
```bash
yt-dlp -x --audio-format mp3 -o "public/Media/song.mp3" --force-overwrites "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Applying the Custom 6-Band Equalizer (EQ)
To apply the custom punchy V-curve equalizer curve (tuned for deep bass, clean vocals, and crisp highs):

| Band | Frequency | Gain | Purpose |
| :--- | :--- | :--- | :--- |
| **Band 1** | 60 Hz | **+7.0 dB** | Sub-bass boost |
| **Band 2** | 150 Hz | **+9.0 dB** | Bass punch peak |
| **Band 3** | 400 Hz | **-7.0 dB** | Mud scoop |
| **Band 4** | 1 kHz | **-3.0 dB** | Midrange balance |
| **Band 5** | 2.4 kHz | **-7.0 dB** | Vocal harshness scoop |
| **Band 6** | 15 kHz | **+3.5 dB** | Treble air & clarity |

Run FFmpeg with the equalizer filter chain and anti-clipping limiter:
```bash
ffmpeg -y -i "input.mp3" -af "equalizer=f=60:t=q:w=1.2:g=7,equalizer=f=150:t=q:w=1.2:g=9,equalizer=f=400:t=q:w=1.2:g=-7,equalizer=f=1000:t=q:w=1.2:g=-3,equalizer=f=2400:t=q:w=1.2:g=-7,equalizer=f=15000:t=q:w=1.0:g=3.5,alimiter=limit=0.95" -b:a 320k "public/Media/song.mp3"
```

---

## 3. Background Media & Customization

### Media Files in `public/Media/`
Place your files in [`public/Media/`](public/Media/):

| Filename | Type | Notes |
| :--- | :--- | :--- |
| `background.mov` / `background.mp4` / `background.webm` | Video | Background video (takes priority over image if present) |
| `background.jpg` / `background.png` | Image | Fallback/default image background |
| `song.mp3` or `sound.mp3` | Audio | Background music track (loops on click-to-enter) |
| `avatar.jpg` / `avatar.png` | Image | Fallback avatar (used if Discord avatar is unavailable) |

### Text & Profile Config (`src/config/profile.ts`)
Open [`src/config/profile.ts`](src/config/profile.ts) to adjust profile details:
```ts
export const profile = {
  username: "Lennox",
  displayName: "@Lennox",
  uid: 250,
  views: 3853,
  joined: "Joined almost 3 years ago",
  enterText: "click to enter",
  title: "Lennox",
  discordInvite: "https://discord.gg/YOUR_INVITE",
} as const;
```

---

## 4. Local Development

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Start the local development server (Turbopack)
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

### Verify Build
To test that TypeScript types and production assets compile without issues:
```bash
npm run build
```

---

## 5. Deployment (Vercel)

This repository is pre-configured for instant zero-configuration deployment to [Vercel](https://vercel.com).

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Update profile"
   git push origin main
   ```
2. Import the repository in your Vercel dashboard.
3. (Optional) For the **persistent unique view counter**:
   - In Vercel, go to **Storage** → **Marketplace** → **Upstash Redis** and link a database.
   - Under **Project Settings → Environment Variables**, add:
     - `VIEW_HASH_SECRET`: Any random secret string (used to hash visitor IPs).
