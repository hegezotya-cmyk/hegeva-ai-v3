import { StagingTestGuardDurableObject } from "../src/staging-scheduled-test-guard-do.js";
export { StagingTestGuardDurableObject };
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/local-test") return new Response("not-found", {status:404});
    const id = env.GUARD.idFromName("local-single-flight");
    const stub = env.GUARD.get(id);
    const action = url.searchParams.get("action");
    const nonce = url.searchParams.get("nonce");
    const input = {scenario:"retry-recovery", nonce, deadline:Date.now()+5000};
    if (action === "acquire") return Response.json({result:await stub.acquire(input)});
    if (action === "release") return Response.json({result:await stub.release(input)});
    if (action === "expire") return Response.json({result:await stub.clearExpired({scenario:"retry-recovery"})});
    return Response.json({error:"invalid-action"},{status:400});
  },
};
