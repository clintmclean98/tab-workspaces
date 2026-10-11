import { useEffect, useState } from "react";
import { listCollections, onCollectionsChange } from "./store";
import type { Collection } from "./types";

/** Live list of collections, newest first. `null` until the first load completes. */
export function useCollections(): Collection[] | null {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  useEffect(() => {
    const load = () => void listCollections().then(setCollections);
    load();
    return onCollectionsChange(load);
  }, []);
  return collections;
}
