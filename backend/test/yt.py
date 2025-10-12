from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled, VideoUnavailable
from youtube_transcript_api import (
    TranscriptList,
    FetchedTranscript,
    NotTranslatable,
    FetchedTranscriptSnippet
)


def get_transcript_text(transcript: FetchedTranscript):
    print(transcript)
    transcript_text_list = [transcript_snippet.text for transcript_snippet in transcript]
    transcript_text = " ".join(transcript_text_list)
    return transcript_text


youtube_transcript_api = YouTubeTranscriptApi()

VIDEO_ID = "AJWBa_SuZ8Q"

def load_video_transcript(video_id: str) -> str:
    """Return the transcript of the video in string format"""
    try:
        transcript = youtube_transcript_api.fetch(video_id=video_id, languages=["en"])
        return transcript
    
    except NoTranscriptFound:
        """Raised if the transcript is not found in English"""
        languages = youtube_transcript_api.list(video_id)
        print("Languages are", languages)

        manually_generated = languages._manually_created_transcripts
        auto_generated = languages._generated_transcripts

        manually_generated.update(auto_generated)
        available_languages = manually_generated

        print("AVAILABLE LANGUAGES", available_languages)

        for lang_code, transcript_obj in available_languages.items():
            try:
                translated_obj = transcript_obj.translate('en')
                print(translated_obj)
                fetched_transcript_obj = translated_obj.fetch()
                return fetched_transcript_obj
            
            except NotTranslatable:
                print("Language is not translatable")

            except Exception as e:
                print("Error during the translation of the language", e)
                return
            

    except TranscriptsDisabled:
        """Raised if the video disabled captions"""
        print("The video disables the subtitiles")
    except VideoUnavailable:
        languages = youtube_transcript_api.list(VIDEO_ID)
        print(languages)  
    except Exception:
        languages = youtube_transcript_api.list(VIDEO_ID)
        print(languages)


fetched_transcript = load_video_transcript(video_id="AJWBa_SuZ8Q")

if fetched_transcript is None:
    print("No transcript available for this video")
else:
    transcript_text = get_transcript_text(fetched_transcript)



def find_transcript_exists(video_id: str):
    video_id = "AJWBa_SuZ8Q"
    transcript_list = youtube_transcript_api.list(video_id=video_id)
    print(transcript_list)
    try:
        transcript = transcript_list.find_transcript(language_codes=['en'])
    except NoTranscriptFound:
        print("Video transcript not found in english")



snippets = [
    FetchedTranscriptSnippet(text="It's December 2014. I'm in college and", start=0.08, duration=5.52),
    FetchedTranscriptSnippet(text="I'm staring at my laptop screen, feeling", start=3.28, duration=4.24),
    FetchedTranscriptSnippet(text="completely defeated. I've spent the last", start=5.6, duration=4.48),
    FetchedTranscriptSnippet(text='8 hours trying to build a simple college', start=7.52, duration=5.039),
    FetchedTranscriptSnippet(text='project in a serious enterprise', start=10.08, duration=4.479),
    FetchedTranscriptSnippet(text='language. My roommate Jake walks by and', start=12.559, duration=4.081),
    FetchedTranscriptSnippet(text='sees my frustration and I remember him', start=14.559, duration=4.56),
    FetchedTranscriptSnippet(text="asking me what I'm working on. I explain", start=16.64, duration=4.399),
    FetchedTranscriptSnippet(text='the project and Jake sits down to show', start=19.119, duration=3.761),
    FetchedTranscriptSnippet(text='me something on his computer. He opens', start=21.039, duration=4.561),
    # ... continue for all other snippets
]

# Example of accessing them
for snippet in snippets:
    print(snippet.text, snippet.start, snippet.duration)









transcript_text = """
It's December 2014. I'm in college and I'm staring at my laptop screen, feeling completely defeated. I've spent the last 8 hours trying to build a simple college project in a serious enterprise language. My roommate Jake walks by and sees my frustration and I remember him asking me what I'm working on. I explain the project and Jake sits down to show me something on his computer. He opens up his laptop and in 15 minutes he builds the exact same tool that I've been working on for like 8 hours. but he doesn't use the language I'm using. He uses something called Python. Now, that is how I was introduced to Python, and I've never looked back since. But by the end of this video, you'll see exactly why Python has conquered like every domain in programming, and why even the biggest skeptics are finally admitting to defeat and using Python. And I'll warn you now, the statistic I'm about to show you in this video will probably shock you as much as it shocked me. Now, before we dive in, I want to tell you something pretty exciting. The first global summit dedicated to AI security is happening this October and hosted by today's sponsor, Sneak. Dev Seccon 2025 is a global community summit on AI security happening virtually on October 22nd and it's completely free. This is not just another security conference. This one's for developers by developers and it's tackling exactly what we're all thinking about right now. How do we build with AI safely? So, why should you join? Well, you get to see hands-on demos showing realworld vulnerability detection, community-led research you won't find anywhere else, AI developer challenge with incredible prizes. Oh, and did I mention it's entirely free? The speaker lineup alone is worth clearing your calendar for. As someone who builds and teaches AI powered back-end systems, I know how often secure by default gets left out of the conversation. This summit is designed to change that and help us build smarter and safer with AI. If you're a back-end engineer, LLM builder, or a dev sec ops enthusiast, don't miss this. Register now at the link in the description and block off October 22nd. Now, let's go ahead and look at this graph, which shows the programming language usage from 2010 until 2024. See that steep line shooting up like a rocket? That's Python's popularity. Almost all other languages are basically flat by comparison. But here's what's really crazy about this graph. That explosive growth wasn't random. It follows a pattern that's repeated five times now. And once you see that pattern, you understand why Python is about to dominate even more domains and really take over the entire ecosystem. So what is this pattern? Well, the pattern is kind of like a five-step pattern kind of. Step one is that there's new technical challenges which is like web APIs, big data, AI, automation. Two is that there's traditional language struggle with unnecessary complexity. Three is that Python makes it simple and accessible by SDKs. So like everything kind of works together. Four, Python wins by speed and development. And then five, I guess, is the repeat of all those four steps. So I don't know that I don't know if that's really a step or not, but it works for me. And that process has happened with data science. It's happened with machine learning. It's happened with automation, scientific computing, and most recently web APIs. And Python is the number one language and current AI like LLMs. But before we dive into that, let me tell you about the Christmas holiday of 1989 that kind of started the whole Python revolution. So in 1989, most programmers were trapped using languages that felt more like punishment than tools that help you actually build software. There was a programmer in Amsterdam and he was completely fed up with this. Like I said, it's Christmas vacation and instead of relaxing, he's thinking about everything wrong with current computing and current programming. Languages that require pages of setup just to get one thing working. Languages that made simple tasks pretty complex. So, he starts building something radical during Christmas vacation. He calls it Python after Monty Python. A detail that immediately tells you that this language wasn't to sound intimidating. And if you haven't seen the movie of MontiPython, I definitely suggest adding it to your bucket list of movies to watch because it's hilarious. But here's what he didn't expect. He wasn't just creating a programming language. He was accidentally starting a 35-year war against programming complexity. When Python first appeared, the reactions from serious programmers were not that great. There was criticism on that it's too simple, criticism on that it's too slow, that the indentationbased syntax is a joke, but something was happening that the establishment didn't really see coming. And that's how Python won hearts. While the experts were looking elsewhere and what I mean by that is while programming conferences were debating enterprise frameworks and performance, Python was building something more dangerous, a community, if you will, of people who actually looked forward to programming. Python became the secret weapon to teachers. Computer science professors were finally able to teach programming concepts without spending half the time setting up boilerplate. Python also became the secret weapon of scientists during this time. So researchers who needed to crunch numbers didn't have to waste months learning programming and object-oriented programming. They just needed something that they could work with now to create scripts. And then third, Python became the weakened language of engineers. And what I mean by that is developers that were programming in these like verbose enterprise languages wanted to try something easier, maybe a little bit more fun on the weekend. And the reason they wanted to try that out was because programming in Python was fun. And to be honest, I was part of the programmers that dismissed Python, you know, recently. And I had dismissed it like 10 years ago. But three massive shifts in general have made Python unstoppable. Shift number one was the data explosion that happened in like 2010. So around 2010, companies suddenly realized that they were sitting on gold mines of data, but they had no idea like how to dig. They didn't have to shovel to get the data that they needed. Here's the thing about enterprise languages though. They they were designed to make simple things kind of complicated. Like not on purpose, but there was so much boilerplate code and things that needed to get set up to run successfully. And Python kind of flipped that completely. Libraries like NumPy and Pandas made data feel natural while you could like visualize the data with Mattplot lib. So this gold mine of data that these companies had were now accessible. Now shift two of this Python revolutions happened in 2012. In 2012, AlexNet shocked the world by crushing every other application in image recognition. So, machine learning went from academic curiosity to business necessity literally like within 24 hours. But AI required massive experimentation, right? You needed to test thousands of different approaches, adjust the parameters to whatever was coming in and constantly iterate on those ideas. So, in general, Python became the perfect tool for AI exploration. And that's kind of where the birth of TensorFlow and PyTorch turned Python into the universal language for just artificial intelligence in general. And Google, Facebook, Netflix, OpenAI, all of them have standardized their entire AI operations on Python. Now, shift three was kind of like the speed resolution which started in like 2015 and it's still going on now. And that was that the tech industry suddenly realized that developer productivity mattered more than execution speed or the programming language speed for like 95% of applications. Companies that spent months optimizing code to run like 10% faster were getting destroyed by competitors who were shipping new features every week. That's how you hear about these startup companies that are able to get funding and make money. They were building fast. They were building features that people needed now. And just when people thought Python had conquered only data science and AI, a new framework called fast API appeared that made building web APIs so simple and fast that it started converting entire teams from traditional web frameworks to Python to build these restful endpoints. And fast API could create complete productionready APIs with automatic documentation and type safety and high performance in just a few lines. So what traditionally required dozens of files and hundreds of lines of code can now be done simply and with functions that are completely readable. AI companies started switching their entire back-end infrastructure to Python because of all the SDKs and wrappers that allowed that work just so perfectly with Python and then you had like fast API as the endpoints and it was just beautiful. So by 2024, Python had became the default choice for data science and analytics, machine learning and AI, AI application, web APIs and microservices, automation and scripting, scientific computing and educational programming. But here's a statistic that will probably blow your mind. On January 15th of 2024, there were exactly 312,847 Python job postings active on major job boards. 5 years before that only 47,329. That's not growth. That's not even explosive growth. That's a complete market shift. But here's a statistic that really shocked me. And this was kind of recently. So according to GitHub's 2024 data, Python isn't just popular with new programmers. It's the number one language that experienced developers are switching to from other languages as well. It's the number one most popular programming language on GitHub. Really think about what that means for a second, right? So senior developers with years of experience in other languages are voluntarily switching to Python. So why is this happening? Well, I believe that there's exactly one reason why this is happening. And that one reason is that it's the ecosystem that actually just works. Python didn't just become popular. It created an ecosystem where you can download libraries and SDKs and everything just works together seamlessly. You can build a complete AI powered web application in Python by just importing fast API for the web framework, TensorFlow for machine learning, pandas for the data manipulation, SQL alchemy for the OM and database connection, and you can just use like Reddus just like you would for any other application for caching. Now, if you wanted to create like an LLM, OpenAI, Claude, any kind of LLM provider that you know of has an SDK that integrates easily with Python. All of these libraries work together very well. No integration hell, no compatibility issues, no version conflicts, just tools that solve problems, and that's what most people are looking for. So, why are some developers still fighting Python and why they're probably going to lose? Not everyone is celebrating Python's recent dominance. Let me address the biggest criticisms cuz they're real and I I kind of want to address them. And the number one is that Python is just too slow for real applications. And you'll see that a lot. However, for 97% of applications, developer time is 50 times more expensive than computer power. And it might be even higher than 97%. I'm making up that number, but a very high number. Now, this one in general kind of makes me laugh. Python is part of Instagram, who has like 4 billion photos processed daily. Netflix, which is has 400 million hours of video streams daily. Part of like Tesla autopilot, which is for safety. It's on the roller in Mars for NASA. So like Python is on a different planet. If handling billions of requests isn't enterprise ready then I mean nothing is really right. So that is um a false claim in my opinion. Another thing you'll hear often is that the syntax is too simple or you know easy to learn. Now Python syntax is easy. It's easy to get started with but it's still extremely hard to master. And that's really what you want from a programming language. Easy to get started, hard to master. Now, if you're new to Python, here are the exact steps I would take to kind of start learning Python. So, if you're new to programming, you're we're going to start with like a 30 plus day plan. And week one is just kind of learning the basic Python fundamentals. Week two is more advanced Python fundamentals, like learning about like objects. And then weeks 3 to six, I would just dive into it. I would get a fast API tutorial with database integration and personal API project. Build something that's really awesome, at least to you, to really get started. There's nothing better than just kind of jumping into the fire. And then after that, you want to build even a bigger project like a capstone. That's where you can really learn and that's where you're really going to run into issues. But that's where you can really start diving and really start, you know, absorbing everything out there that you can learn. Now, if you're already a programmer, I mean, we probably can now learn it in a couple days. So like day one to three, you need to unlearn some bad habits. Embrace Python, learn the Pythonic way and what that means. Day four to seven, I would say pick your dome domain. You know, build something that you've built before. Just use Python. And then days eight and 11, you're going to want to learn some advanced concepts. So like decorators, async away, package management, and what you want to use for that. And then days 12 to 14, build something production ready and apply Python to real work problems. And there's a few key things you want to keep in the back of your mind while you're learning Python. And that's to embrace simplicity as a feature, not as a limitation. You want to focus on solving problems, not just showing off like your technical knowledge. And then three, build real projects that matter to you personally. So, after like 5 years of dismissing Python, and then like 7 years of embracing it, here's what I've learned. Python didn't win because it was perfect. It won because it's useful. Python didn't win because it was the fastest. It's winning because it's made for programmers to program fast. Python didn't win by trying to impress other programmers. It won by helping people solve real problems. And it didn't have to be a full-on programmer that knows how to handle it. The programming industry is changing, I would say, in in a lot of ways, especially with AI. Companies want developers who can build working solutions quickly and reliably, not developers who write, you know, complex code and multiple different languages and having to use AI to understand what's going on. Python represents a shift better than any other technology in my opinion. Every developer has their Python story. I mean, I think every developer's at least tried it. Maybe yours is still ahead of you. Maybe you'll start skeptical like I did or you're currently skeptical and realize that Python isn't, you know, just a slow alternative language, but it's really good at building real software. Or maybe you'll discover that Python doesn't just make you more productive. It makes your programming just enjoyable again. Like if you wanted to try and code something on the weekend. But all I can say is no matter where you are in your journey, just keep learning, keep choosing tools that make you more effective. and I'll see you in the next
"""

