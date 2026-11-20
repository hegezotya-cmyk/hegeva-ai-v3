// Isolated synthetic-only Worker. Deliberately NO API, no auth, no HTTP route,
// no scheduled handler, no HubSpot transport. A deployment is NOT authorized.
export default {
  async fetch() {
    return new Response("Not Found", {
      status: 404,
      headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
    });
  },
};
