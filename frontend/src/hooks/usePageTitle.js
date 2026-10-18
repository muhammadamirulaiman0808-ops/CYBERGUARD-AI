import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | CyberGuard AI` : "CyberGuard AI";
  }, [title]);
}
