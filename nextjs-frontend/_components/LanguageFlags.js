// components/LanguageFlag.js

import React from "react";
import { getFlagUrl } from "../_utils/views";

export default function LanguageFlag({ code }) {
  const flagUrl = getFlagUrl(code);

  if (!flagUrl) return <span title="unknown">🌐</span>;

  return (
    <img
      src={flagUrl}
      alt={code}
      title={code}
      style={{
        height: "1.25vh",
        width: "auto",
        verticalAlign: "middle",
        display: "inline-block"
      }}
    />
  );
}
