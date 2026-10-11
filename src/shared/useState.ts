import { useEffect, useState } from "react";
import { getState, onStateChange } from "./store";
import type { State } from "./types";

export function useAppState(): State | null {
  const [state, setLocal] = useState<State | null>(null);
  useEffect(() => {
    void getState().then(setLocal);
    return onStateChange(setLocal);
  }, []);
  return state;
}
