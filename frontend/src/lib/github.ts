/**
 * The GitHub field asks for a bare username (it's used to hit GitHub's API
 * directly), unlike the LinkedIn/Indeed/Upwork fields next to it which want
 * full URLs — an easy field to trip on. Pull the username out if someone
 * pastes a profile URL instead.
 */
export function extractGithubUsername(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  const match = trimmed.match(/github\.com\/([^/?#]+)/i);
  return (match ? match[1] : trimmed).replace(/\/+$/, "");
}
