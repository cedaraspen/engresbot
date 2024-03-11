import { Devvit, RichTextBuilder } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true, // context.reddit will now be available
  media: true
});

Devvit.addMenuItem({
  label: '[Eng Res Test] Add creation post',
  location: 'subreddit',
  forUserType: 'moderator',

  onPress: async (_, { reddit, ui }) => {
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      // This will show while your custom post is loading
      preview: (
        <vstack padding="medium" cornerRadius="medium">
          <text style="heading" size="medium">
            Loading Engineering Resume creator...
          </text>
        </vstack>
      ),
      title: `Post your resume here`,
      subredditName: subreddit.name,
    });

    ui.showToast({
      text: `Successfully posted the Engineering Resume Creator!`,
      appearance: 'success',
    });
  },
});

const MIN_IMAGE_WIDTH = 300
function isValidDimension(urlString: string): boolean {
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

Devvit.addCustomPostType({
  name: 'Hello Blocks',
  height: 'regular',
  render: ({ ui, useState, useForm, reddit, media }) => {
    const [currentUsername] = useState(async () => {
      const currentUser = await reddit.getCurrentUser();
      return currentUser.username;
    });

    const creationForm = useForm({ fields: [
      {
        type: 'string',
        label: 'Title',
        helpText: 'Title for your post',
        required: true,
        name: 'postTitle',
      },
      {
        type: 'paragraph',
        label: 'Additional context',
        helpText: 'Please provide additional context',
        required: true,
        name: 'additionalContext'
      },
      {
        type: 'string',
        label: 'Resume URL',
        helpText: 'Must be a Reddit hosted image!',
        required: true,
        name: 'resumeUrl',
      },
    ]}, async ({ resumeUrl, additionalContext, postTitle }) => {
      if(!isValidDimension(resumeUrl)) {
        ui.showToast('Invalid URL or dimensions provided');
      }

      const imgMedia = await media.upload({ url: resumeUrl, type: 'image '});
      const rtBuilder = new RichTextBuilder();
      rtBuilder.image({ mediaId: imgMedia.mediaId });
      rtBuilder.paragraph(additionalContext);

      const currentSubreddit = await reddit.getCurrentSubreddit();
      const post = await reddit.submitPost({
        title: postTitle,
        subredditName: currentSubreddit.name,
        richtext: rtBuilder,
      });

      ui.showToast('Successfully submitted post!');
      ui.navigateTo(post);
    });

    // Your custom post layout goes here!
    return (
      <vstack alignment='center middle' height='100%' gap='large'>
        <text size='xxlarge' weight='bold'>
          Hello {currentUsername}! 👋
        </text>
        <text>Welcome to r/EngineeringResumes. </text>
        <button appearance='primary' onPress={() => { ui.showForm(creationForm) }}>
          Post your resume
        </button>
      </vstack>
    );
  },
});

export default Devvit;
