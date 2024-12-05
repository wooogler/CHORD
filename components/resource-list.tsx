export default function ResourceList({
  articleTitle,
}: {
  articleTitle: string;
}) {
  return (
    <>
      <div className="text-xl font-bold">Reference</div>
      {articleTitle === "Facebook" ? (
        <ul className="list-disc ml-4">
          <li>
            <a href="https://www.facebook.com/help" target="_blank">
              Facebook Help Center
            </a>
          </li>
          <li>
            <a
              href="https://about.fb.com/news/2024/10/facebook-local-tab-messenger-communities-ai/"
              target="_blank"
            >
              New Feature: Local Tab, Messenger Communities, AI Integrations and
              More
            </a>
          </li>
          <li>
            <a
              href="https://www.reddit.com/r/facebook/comments/1f43i7q/why_are_people_still_using_facebook_what_does/"
              target="_blank"
            >
              Reddit Post: Why are people still using Facebook? What does
              Facebook have that other platforms don&apos;t?
            </a>
          </li>
        </ul>
      ) : articleTitle === "YouTube" ? (
        <ul className="list-disc ml-4">
          <li>
            <a href="https://www.youtube.com/howyoutubeworks/" target="_blank">
              How YouTube Works
            </a>
          </li>
          <li>
            <a
              href="https://blog.youtube/news-and-events/youtube-features-and-updates-2024/"
              target="_blank"
            >
              YouTube Features and Updates 2024
            </a>
          </li>
          <li>
            <a
              href="https://www.reddit.com/r/youtube/comments/1f3hwex/what_are_some_new_youtube_features_you_actually/"
              target="_blank"
            >
              Reddit Post:What are some new YouTube features you actually like
            </a>
          </li>
        </ul>
      ) : (
        <></>
      )}
    </>
  );
}
