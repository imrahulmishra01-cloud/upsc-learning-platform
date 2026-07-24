export async function fetchEnglishMetadata(url: string): Promise<{ title: string | null }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      return { title: null };
    }

    // Read only a small chunk to avoid downloading a huge payload if it's large,
    // though text() will read the whole thing. It's safe enough for PIB HTML.
    const html = await res.text();

    // Look for og:title first
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']\s*\/?>/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      // Basic unescape
      const title = ogTitleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
      return { title };
    }

    // Fallback to <title>
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
      return { title };
    }

    return { title: null };
  } catch (error) {
    console.error("[metadata-fetcher] Error fetching:", url, error);
    return { title: null };
  }
}
