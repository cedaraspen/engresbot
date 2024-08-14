import { Post, RichTextBuilder } from "@devvit/public-api";

const MIN_IMAGE_WIDTH = 2480
export async function isValidDimension(urlString: string): Promise<boolean> {
  const url = new URL(urlString);
  const widthStr = url.searchParams.get('width');
  let width = 0;
  if (!widthStr) {
    return false;
  } else {
    width = parseInt(widthStr);
  }

  if (width < MIN_IMAGE_WIDTH) {
    return false;
  }

  return true;
}

export function containsValidImage(post: Post): boolean {
  const imageUrl = getImageUrl(post);
  if (!imageUrl) {
    console.error('Cannot find image URL');
    return false
  }

  if(!isValidDimension(imageUrl)){
    console.error('Dimensions invalid');
    return false;
  }

  return true;
}

export function getImageUrl(post: Post) {
  console.log('postUrl', post.url);
  console.log('bodyHtml', post.bodyHtml);
  return parseUrl(post.url) || parseUrl(post.bodyHtml!);
}

export function getMediaId(imageUrl: string): string | undefined {
  const matches = imageUrl.match(/https?:\/\/i\.redd\.it\/([a-zA-Z0-9]+)\.\w+/);
  if(!matches) {
    return undefined;
  }
  return matches[1];
}

const rtjson = new RichTextBuilder();
rtjson.image({mediaId: 'abc'});
rtjson.image({ mediaUrl: '' })
function parseUrl(text: string) {
  if (!text) {
    return undefined;  
  }
  // Regular expression to match URLs
  const urlRegex = /https:\/\/(preview|i)\.redd\.it\/[a-zA-Z0-9]+.+/g;

  console.log('parseUrl.text', text);
  // Find all matches in the input text
  const matches = text.match(urlRegex);

  if (!matches) {
    return undefined;
  }
  return matches[0]
}
