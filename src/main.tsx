import { Devvit, RichTextBuilder } from '@devvit/public-api';
import { isValidDimension, getImageUrl } from './utils/images.js';

Devvit.configure({
  redditAPI: true, // context.reddit will now be available
  media: true
});

// Image quality check bot
Devvit.addTrigger(
  {
    event: 'PostSubmit',
    async onEvent(event, { reddit }) {
      if(!event.post || !event.author) {
        throw 'Invalid post object'
      }
      const postBody = event.post.selftext;
      const imageUrl = getImageUrl(postBody);
      if(imageUrl && isValidDimension(imageUrl)) {
        return; // Do nothing, it was a valid imageUrl
      }

      // Now we have problems...
      const commentRichText = new RichTextBuilder();
      const user = await reddit.getUserById(event.author.id);
      const username = user.username;
      const text = `
      Hi u/${username}, please follow the instructions below and submit a higher quality image:
      Export your resume as a PDF file

      Convert it to a 600 DPI PNG file using https://www.cleverpdf.com/pdf-to-images: https://imgur.com/RxxYFQe

      On DESKTOP (NEW.REDDIT), insert the PNG into a text submission

      Please don't:

      Take a picture of your resume with your phone camera

      Take a screenshot of your resume

      Crop out your margins

      Upload a dark mode version of your resume
      `
      commentRichText.paragraph(() => {text: text});
      await reddit.submitComment({ id: event.post.id, richtext: commentRichText })
     }
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
