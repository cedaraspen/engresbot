const MIN_IMAGE_WIDTH = 300
export function isValidDimension(urlString: string): boolean {
  const url = new URL(urlString);
  const widthStr = url.searchParams.get('width');
  if(!widthStr) {
    return false;
  }

  const width = parseInt(widthStr);

  if(width < MIN_IMAGE_WIDTH) {
    return false;
  }

  return true;
}

export function getImageUrl(text: string) {
    // Regular expression to match URLs
    const urlRegex = /https:\/\/preview\.redd\.it\/[a-zA-Z0-9]+\.png/g;

    // Find all matches in the input text
    const matches = text.match(urlRegex);

    if (matches) {
        // Assuming there's only one redd.it URL in the text
        return matches[0];
    }
    return undefined
}
