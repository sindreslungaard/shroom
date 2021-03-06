import { tryFetchBuffer } from "./fetching";

export async function fetchFurni(
  dcrUrl: string,
  revision: string | undefined,
  name: string
) {
  const url =
    revision != null
      ? `${dcrUrl}/${revision}/${name}.swf`
      : `${dcrUrl}/${name}.swf`;

  const buffer = await tryFetchBuffer(url);

  return {
    revision,
    name,
    buffer,
  };
}
