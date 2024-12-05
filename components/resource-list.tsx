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
      ) : articleTitle === "Virginia Tech" ? (
        <ul className="list-disc ml-4">
          <li>
            <a
              href="https://web.archive.org/web/20181216183433/https://www.washingtonpost.com/education/2018/11/14/amazon-hq-arrival-spurs-virginia-tech-build-technology-campus-northern-virginia/"
              target="_blank"
            >
              Svrluga, Susan (November 13, 2018). &quot;Amazon arrival spurs
              Virginia Tech to build technology campus in Northern
              Virginia&quot;. Washington Post. Archived from the original on
              December 16, 2018.
            </a>
          </li>
          <li>
            <a
              href="https://web.archive.org/web/20190531165248/https://www.roanoke.com/news/education/higher_education/virginia_tech/some-incoming-virginia-tech-freshmen-offered-money-to-delay-start/article_6ed2a7b2-3b31-500a-a810-e3f968866c3b.html"
              target="_blank"
            >
              Korth, Robby (May 29, 2019). &quot;Some incoming Virginia Tech
              freshmen offered money to delay start in effort to relieve
              enrollment strain&quot;. Roanoke Times. Archived from the original
              on May 31, 2019. Retrieved May 31, 2019.
            </a>
          </li>
        </ul>
      ) : (
        <></>
      )}
    </>
  );
}
