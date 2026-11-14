import { getServers, setServers } from "node:dns";

function isLoopback(server: string) {
  const host = server.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return host === "127.0.0.1" || host === "::1" || host === "0.0.0.0";
}

export function usePublicDnsWhenLoopback() {
  const servers = getServers();
  if (servers.length === 0 || servers.every(isLoopback)) {
    setServers(["8.8.8.8", "1.1.1.1"]);
  }
}
