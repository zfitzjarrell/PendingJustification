import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Top bar so it feels like a popup app window */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/10 text-white text-sm">
        <div className="font-semibold">192.168.0.1 - The Official Homepage</div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="rounded bg-white/10 px-2 py-1 hover:bg-white/20"
          >
            Enter Portal
          </a>
          <button
            className="rounded bg-white/10 px-2 py-1 hover:bg-white/20"
            onClick={() => window.close()}
            type="button"
          >
            Close
          </button>
        </div>
      </div>

      {/* Image-based retro page */}
      <div className="relative mx-auto max-w-5xl p-3">
        <div className="relative overflow-hidden rounded-lg border border-white/10 shadow-2xl">
          <img
            src="/retro-home.png"
            alt="Retro home"
            className="block w-full h-auto select-none"
            draggable={false}
          />

          {/* Clickable hotspots (optional but fun) */}
          <div className="absolute inset-0">
            {/* Big banner area: go to dashboard */}
            <Link
              to="/dashboard"
              className="absolute left-[18%] top-[7%] h-[16%] w-[64%]"
              aria-label="Enter the Portal"
              title="Enter the Portal"
            />

            {/* Guestbook: just a joke */}
            <button
              type="button"
              onClick={() => alert("Guestbook is currently under construction. Forever.")}
              className="absolute left-[33%] top-[40%] h-[10%] w-[18%]"
              aria-label="Guestbook"
              title="Guestbook"
            />

            {/* Random “other site” link */}
            <button
              type="button"
              onClick={() => alert("That IP is offline pending alignment.")}
              className="absolute left-[22%] top-[78%] h-[8%] w-[38%]"
              aria-label="Other sites"
              title="Other sites"
            />
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-white/60">
          This page is informational only and should not be used for decision making.
        </p>
      </div>
    </div>
  );
}
