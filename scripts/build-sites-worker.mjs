import { mkdir, writeFile } from "node:fs/promises";

await mkdir("dist/server", { recursive: true });
await writeFile(
  "dist/server/index.js",
  `const worker = {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);

    if (response.status === 404 && request.method === "GET") {
      const url = new URL(request.url);
      if (!url.pathname.startsWith("/assets/") && !url.pathname.includes(".")) {
        return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
      }
    }

    return response;
  },
};

export default worker;
`,
);
