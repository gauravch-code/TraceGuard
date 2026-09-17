export function browserWriteError(request: Request, requireJson = false) {
  const origin = request.headers.get("Origin");
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if ((origin && origin !== new URL(request.url).origin) || (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")) {
    return Response.json({ error: "Cross-origin writes are not allowed." }, { status: 403 });
  }
  if (requireJson && !request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }
  return null;
}
