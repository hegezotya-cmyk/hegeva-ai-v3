// Keep production analytics off localhost, preview Workers and unrelated hosts.
// Staging always uses its own explicitly supplied measurement ID.
const PRODUCTION_HOSTNAMES = new Set(["hegevaai.co.uk", "www.hegevaai.co.uk"])
export function analyticsCollectionAllowed(hostname, isStaging) {
  return isStaging === true || (isStaging === false && PRODUCTION_HOSTNAMES.has(hostname))
}
