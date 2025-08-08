import fetch from "node-fetch";

export default async function handler(req, res) {
  // Always set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const query = req.query.q || "video editor";

  try {
    const twitterRes = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
        query
      )}&tweet.fields=author_id,created_at&expansions=author_id&user.fields=username,profile_image_url`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    if (!twitterRes.ok) {
      // Still include CORS headers here before sending error
      return res
        .status(twitterRes.status)
        .json({ error: `Twitter API error: ${twitterRes.statusText}` });
    }

    const data = await twitterRes.json();

    // Transform data for frontend
    const usersMap = new Map();
    if (data.includes && data.includes.users) {
      data.includes.users.forEach((u) => usersMap.set(u.id, u));
    }

    const results = (data.data || []).map((tweet) => {
      const user = usersMap.get(tweet.author_id) || {};
      return {
        name: user.username || "Unknown",
        profileImage: user.profile_image_url || "",
        tweet: tweet.text,
        createdAt: tweet.created_at,
      };
    });

    return res.status(200).json({ results });
  } catch (err) {
    // Ensure CORS headers on error too
    return res.status(500).json({ error: err.message });
  }
}
