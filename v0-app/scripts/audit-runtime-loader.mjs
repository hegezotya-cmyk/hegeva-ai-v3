export async function resolve(specifier, context, nextResolve) {
  if (specifier === "better-auth") {
    return {
      url: new URL("../node_modules/better-auth/dist/index.mjs", import.meta.url).href,
      shortCircuit: true,
    }
  }

  return nextResolve(specifier, context)
}
