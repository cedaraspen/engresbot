import { Post } from "@devvit/public-api";

const MIN_IMAGE_WIDTH = 3000
export function isValidDimension(urlString: string): boolean {
  const url = new URL(urlString);
  const widthStr = url.searchParams.get('width');
  if (!widthStr) {
    return false;
  }

  const width = parseInt(widthStr);

  if (width < MIN_IMAGE_WIDTH) {
    return false;
  }

  return true;
}

export function getImageUrl(post: Post) {
  console.log('postUrl', post.url);
  console.log('bodyHtml', post.bodyHtml);
  return parseUrl(post.url) || parseUrl(post.bodyHtml!);
}

function parseUrl(text: string) {
  if (!text) {
    return undefined;
  }
  // Regular expression to match URLs
  const urlRegex = /https:\/\/preview\.redd\.it\/[a-zA-Z0-9]+.+/g;

  console.log('parseUrl.text', text);
  // Find all matches in the input text
  const matches = text.match(urlRegex);

  if (!matches) {
    return undefined;
  }
  return matches[0]
}
