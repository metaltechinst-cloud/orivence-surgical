// src/components/SocialIcons.tsx
"use client";

import React from "react";
import { Facebook, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";

export interface SocialLinksConfig {
  facebook?: { enabled?: boolean; url?: string; showInHeader?: boolean; showInFooter?: boolean };
  instagram?: { enabled?: boolean; url?: string; showInHeader?: boolean; showInFooter?: boolean };
  linkedin?: { enabled?: boolean; url?: string; showInHeader?: boolean; showInFooter?: boolean };
  youtube?: { enabled?: boolean; url?: string; showInHeader?: boolean; showInFooter?: boolean };
  twitter?: { enabled?: boolean; url?: string; showInHeader?: boolean; showInFooter?: boolean };
  tiktok?: { enabled?: boolean; url?: string; showInHeader?: boolean; showInFooter?: boolean };
  pinterest?: { enabled?: boolean; url?: string; showInHeader?: boolean; showInFooter?: boolean };
  threads?: { enabled?: boolean; url?: string; showInHeader?: boolean; showInFooter?: boolean };
}

interface SocialIconsProps {
  links?: SocialLinksConfig;
  targetLocation: "header" | "footer" | "contact";
  className?: string;
  iconClassName?: string;
}

// Custom SVG Icons for platforms not in standard lucide-react or for consistent rendering
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.9 2.892 2.895 2.895 0 0 1-2.9-2.892 2.895 2.895 0 0 1 2.9-2.892c.38 0 .736.074 1.062.207V9.435a6.34 6.34 0 0 0-1.062-.09 6.338 6.338 0 0 0-6.333 6.338A6.338 6.338 0 0 0 9.473 22a6.338 6.338 0 0 0 6.333-6.338v-6.94c1.37.98 3.047 1.56 4.862 1.56V6.829a4.83 4.83 0 0 1-1.079-.143z"/>
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.5c-5.247 0-9.5-4.253-9.5-9.5S6.753 2.5 12 2.5s9.5 4.253 9.5 9.5c0 3.666-2.046 6.84-5.063 8.397-.43.223-.961.018-1.155-.42-.19-.432.008-.946.438-1.167C18.23 17.514 20 14.947 20 12c0-4.418-3.582-8-8-8s-8 3.582-8 8 3.582 8 8 8c1.558 0 3.013-.448 4.253-1.229.418-.264.975-.141 1.239.278.264.419.141.976-.278 1.239C15.772 20.978 13.948 21.5 12 21.5zm0-13c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5zm0 5.5c-1.103 0-2-.897-2-2s.897-2 2-2 2 .897 2 2-.897 2-2 2z"/>
    </svg>
  );
}

export default function SocialIcons({ links, targetLocation, className = "flex items-center gap-3", iconClassName = "w-4 h-4" }: SocialIconsProps) {
  if (!links) return null;

  const platforms = [
    { key: "facebook", name: "Facebook", Icon: Facebook },
    { key: "instagram", name: "Instagram", Icon: Instagram },
    { key: "linkedin", name: "LinkedIn", Icon: Linkedin },
    { key: "youtube", name: "YouTube", Icon: Youtube },
    { key: "twitter", name: "X (Twitter)", Icon: Twitter },
    { key: "tiktok", name: "TikTok", Icon: TikTokIcon },
    { key: "pinterest", name: "Pinterest", Icon: PinterestIcon },
    { key: "threads", name: "Threads", Icon: ThreadsIcon }
  ];

  const activePlatforms = platforms.filter(({ key }) => {
    const config = (links as any)[key];
    if (!config) return false;
    if (config.enabled === false) return false;
    if (!config.url || !config.url.trim()) return false;
    if (targetLocation === "header" && config.showInHeader === false) return false;
    if (targetLocation === "footer" && config.showInFooter === false) return false;
    return true;
  });

  if (activePlatforms.length === 0) return null;

  return (
    <div className={className}>
      {activePlatforms.map(({ key, name, Icon }) => {
        const url = (links as any)[key].url.trim();
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Follow ORIVENCE on ${name}`}
            className="text-current opacity-70 hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center"
          >
            <Icon className={iconClassName} />
          </a>
        );
      })}
    </div>
  );
}
