import { Devvit, RichTextBuilder } from "@devvit/public-api";
import { containsValidImage, getMediaId, isValidDimension } from "./utils/images.js";

Devvit.configure({
  redditAPI: true, // context.reddit will now be available
  media: true,
});

Devvit.addSettings([
  {
    type: "string",
    label: "Image quality flair id",
    name: "imageQualityFlairId",
  },
]);

const form = Devvit.createForm(
  {
    fields: [
      {
        name: 'title',
        label: 'title',
        type: 'paragraph',
        helpText: "Please format your title as follows:[X YoE] or [Student], where X is the number of your FULL-TIME (NON-INTERNSHIP) years of experience",
        required: true,
        defaultValue: formResponse.title,
      },
      {
        type: 'paragraph',
        name: "description",
        label: 'description',
        helpText: "Please include a brief description 250+ characters of your resume. This can include your experience, skills, and what you are looking for in your next role.",
        required: true,
        defaultValue: formResponse.description,
       },
      {
        name: 'resume',
        label: 'upload image',
        type: 'image',
        required: true,
        helpText: "During conversion, please set DPI to 600 ",
      },
    ],
}, () => { });


Devvit.addMenuItem({
  label: "[Eng Res Test] Add creation post",
  location: "subreddit",
  forUserType: "moderator",

  onPress: async (_, { reddit, ui, v2Events }) => {
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
      appearance: "success",
    });
  },
});

Devvit.addMenuItem({
  label: '[Eng Res Test] Test dimensions',
  location: 'post',
  forUserType: 'moderator',
  onPress: async(event, { reddit, ui }) => {
    const post = await reddit.getPostById(event.targetId);
    const result = containsValidImage(post);
    ui.showToast(`Check result: ${result}`);
  }
});

Devvit.addCustomPostType({
  name: "Hello Blocks",
  height: "regular",
  render: ({ ui, useState, useForm, reddit, media, scheduler }) => {
    const [currentUsername] = useState(async () => {
      const currentUser = await reddit.getCurrentUser();
      if(!currentUser) {
        return undefined;
      }
      return currentUser.username;
    });

    const creationForm = useForm(
      {
        fields: [
          {
            type: "string",
            label: "Title",
            helpText: "Title for your post",
            required: true,
            name: "postTitle",
          },
          {
            type: "paragraph",
            label: "Additional context",
            helpText: "Please provide additional context",
            required: true,
            name: "additionalContext",
          },
          {
            type: 'image',
            label: 'Resume',
            helpText: 'Attach a high resolution PNG file here',
            name: 'resumeUrl',
          },
        ],
      },
      async ({ resumeUrl, additionalContext, postTitle }) => {
        if (!isValidDimension(resumeUrl)) {
          ui.showToast("Invalid URL or dimensions provided");
        }

        const mediaId = getMediaId(resumeUrl);
        if(!mediaId) {
          ui.showToast('Error processing image, please try again ');
          return
        }

        const rtBuilder = new RichTextBuilder();
        rtBuilder.image({ mediaId: mediaId });
        rtBuilder.paragraph(() => additionalContext);

        const currentSubreddit = await reddit.getCurrentSubreddit();
        const post = await reddit.submitPost({
          title: postTitle,
          subredditName: currentSubreddit.name,
          richtext: rtBuilder,
        });

        ui.showToast("Successfully submitted post!");
        ui.navigateTo(post);
      }
    );

    if(!currentUsername) {
      return (
        <vstack alignment="center middle" height="100%" gap="large">
        <button></button>
          <text size="xxlarge" weight="bold">
            You must be logged in to make posts to r/EngineeringResumes
            </text>
        </vstack>
      )
    }

    // Your custom post layout goes here!
    return (
      <vstack alignment="center middle" height="100%" gap="large">
        <text size="xxlarge" weight="bold">
          Hello {currentUsername}! 👋
        </text>
        <text>Welcome to r/EngineeringResumes. </text>
        <button appearance="primary" onPress={() => ui.showForm(creationForm)}>
          Post your resume
        </button>
      </vstack>
    )
},
});

export default Devvit;
