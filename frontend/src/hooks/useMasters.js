import { useEffect, useState } from "react";
import { request } from "../config";

export function useMasters(keys) {
  const [masters, setMasters] = useState({});
  const keySignature = keys.join(",");

  useEffect(() => {
    let active = true;
    Promise.all(keys.map(async (key) => {
      const response = await request(`/settings/${key}`);
      if (!response.ok) throw new Error(`Unable to load ${key}.`);
      return [key, await response.json()];
    }))
      .then((entries) => active && setMasters(Object.fromEntries(entries)))
      .catch(() => active && setMasters({}));
    return () => { active = false; };
    // The caller provides a literal, stable list of master keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keySignature]);

  return masters;
}
