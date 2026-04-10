"use client";

import { useEffect } from "react";

interface HtmlLangSyncProps {
  dir: string;
  lang: string;
}

export default function HtmlLangSync({ dir, lang }: HtmlLangSyncProps) {
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  return null;
}
