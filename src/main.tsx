
import { Devvit } from '@devvit/public-api';
import { imageDimensionsFromData } from 'image-dimensions';
Devvit.configure({ redditAPI: true, redis: true, http: true });


Devvit.addMenuItem({
  label: 'New Post',
  location: 'subreddit', // Show in the subreddit overflow menu.
  onPress: async (_, ctx) => {
    const subreddit = await ctx.reddit.getCurrentSubreddit();
    const post = await ctx.reddit.submitPost({
      preview: ResumePostPreview(),
      title: 'Upload your resume',
      subredditName: subreddit.name,
    });
    ctx.ui.showToast({ text: 'Post created.', appearance: 'success' });
  },
});

function ResumePostPreview(): JSX.Element {
  return (

    <vstack padding="medium" cornerRadius="medium">
      <text style="heading" size="medium">
        Loading...
      </text>
    </vstack>
  );
} 

Devvit.addTrigger({  //Trigger to delete posts that do not meet requirements if using reddit post feature
  event: 'PostCreate',  
  onEvent: async (event, redditAPI) => {  
    const reddit = redditAPI.reddit;
    console.log('Checking new post')
    if (event.post) { 
      //let post = await reddit.getPostById(event.post.id);
      const post = event.post;
      console.log(post.url);
      if (!post.url|| post.url.length === 0) {
        await reddit.remove(post.id, false);
        console.log('Post Deleted - no images');
        return;
      }
      if (post.selftext.length < 250) {
        console.log(post.selftext);
        await reddit.remove(post.id, false);
        console.log('Post Deleted - description too short');
        return;
     }
    }
  },
});

async function getSize(imageUrl: string) {
  const response = await fetch(imageUrl);
  const buffer = new Uint8Array(await response.arrayBuffer());
  const dimensions =  await imageDimensionsFromData(buffer);
  if(!dimensions) {
    throw "Could not determine dimensions";
  }
  return dimensions;
}


Devvit.addCustomPostType({
  name: 'ResumePost',
  render: (ctx) => {
    // Each Reddit API call issues an HTTP request which is slow. Only make a
    // request once on the first render and cache the result across re-renders.
    const [username] = ctx.useState(async () => {
      const user = await ctx.reddit.getCurrentUser();
      return user!.username;
    });
    // Cache the user response, initially empty.
   const[formResponse, setFormResponse] = ctx.useState({
     title: '',
     description: '',
    resume: '',
   } );
    const [title, setTitle] = ctx.useState('');
    const [url, setUrl] = ctx.useState('');
    const [description, setDescription] = ctx.useState('');
    const [errorMessage, setErrorMessage] = ctx.useState('');
    
    const prompt = ctx.useForm(
      {
        fields: [
          {
            name: 'title', 
            label: 'title',
            type: 'paragraph',
            helpText: "Please format your title as follows:[X YoE] or [Student], where X is the number of your FULL-TIME (NON-INTERNSHIP) years of experience",
            required: true, 
          },
          {
            type: 'paragraph',
            name: "description",
            label: 'description',
            helpText: "Please include a brief description 250+ characters of your resume. This can include your experience, skills, and what you are looking for in your next role.",
            required: true,
            
           },
          {
            name: 'resume', 
            label: 'upload image',
            type: 'image',
            required: true,
            helpText: "During conversion, please set DPI to 600 ",
          },
        ],
      },
      
      async (rsp) => {
        if (rsp.description.length < 250) {
          setErrorMessage("Description must be at least 250 characters long");
          ctx.ui.showToast("Error submitting post description must be at least 250 characters");
         //setFormResponse(rsp);
          return; 
        }
        setErrorMessage('');
        // ctx.ui.showToast({ text: 'Resume URL' + rsp.image, appearance: 'success' });
        ctx.ui.showToast({ text: 'post recorded!', appearance: 'success' });
        setTitle(rsp.title); // "title" is the response field key.
        setDescription(rsp.description);
        setUrl(rsp.resume);
  
        const subreddit = await ctx.reddit.getCurrentSubreddit();
        await ctx.reddit.submitPost({
          subredditName: subreddit.name,
          title: rsp.title,
          text: rsp.description + '\n\n[Created by app]', 
          url: rsp.resume, 
        });
        ctx.ui.showToast({ text: 'Post created.', appearance: 'success' });

        setFormResponse({
          title: rsp.title,
          description: rsp.description,
          resume: rsp.resume,
        });
        getSize(rsp.resume)
         .then(dimensions => console.log(dimensions))
         .catch(error => console.error(error));
        return;
      }
    );

       return (
      <vstack height = "100%" padding= "medium">
        <text size="xxlarge" weight="bold" alignment="start"> 
        Welcome to R/EngineeringResumes 
        </text>
        <spacer size = "medium" /> 
        <vstack alignment = "center middle">
        <image url= "https://styles.redditmedia.com/t5_37mk2/styles/image_widget_hz9vevu5t0qb1.png" imageWidth={150} imageHeight={150} />
        <spacer />
        <spacer size = "medium" /> 
        <vstack alignment = "center middle">
        <text size="medium" weight="bold" alignment= "end middle">
          Save yourself the headache and make sure to read the wiki for submission rules 
        </text>
        </vstack>
      </vstack>
      <vstack gap="medium" alignment='middle center'>
      </vstack>
      <vstack alignment="end" height="100%">
        <spacer size = "medium" /> 
        <hstack gap="large" width="100%">
          <button grow 
          appearance= "primary"
          onPress={() => ctx.ui.navigateTo("https://www.reddit.com/r/EngineeringResumes/wiki/submission-instructions/")}
          textColor= "white"
          >
            Wiki
          </button>
          {title ? (
        <text size="xlarge">{title}</text>
        ) : (
           <button grow
            onPress={() => ctx.ui.showForm(prompt)}
            appearance= "primary"
            textColor= "white"
            >
            Continue
          </button>
        )
        }
        {url ? <text size="xlarge">{url}</text> : null}
        {url ? <image url={url} imageHeight={100} imageWidth={100} /> : null} 
        <button grow 
          appearance= "primary"
          onPress={() => ctx.ui.navigateTo("https://www.cleverpdf.com/pdf-to-images#google_vignette")}
          textColor= "white"
          >
            Converter
          </button>
        </hstack>
      </vstack>
    </vstack>
    );
  },
});

export default Devvit;