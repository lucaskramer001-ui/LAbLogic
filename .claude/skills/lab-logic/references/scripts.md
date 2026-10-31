# Topics and scripts

## The user's original Short prompt (use as the brief every time)

> Research the internet and write one original YouTube Shorts script about a surprising fact or an interesting
> question. The video will use simple 2D animations and should be 60-70 seconds long, with around 190-230 words of
> narration. Look for unusual questions, surprising explanations, everyday mysteries, or strange facts about
> science, animals, history, the human body, space, or engineering. For example, "Why don't we throw trash into
> volcanoes?" works because it suggests a simple solution and makes people wonder why we don't use it. Use that
> kind of curiosity, but find a different topic. Research several ideas before choosing the strongest one. Choose
> something that can be explained clearly in 20–30 seconds, has a surprising answer or consequence, is easy to show
> through simple 2D animations, and makes sense without background knowledge. Each time I send this prompt, choose
> a new topic and explanation. Check the ideas already visible in this conversation and avoid repeating them or
> making slight variations of them. Vary the subject categories too. If you cannot access previous ideas, don't
> claim you checked them. Verify the central fact using reliable sources, preferably original research,
> universities, museums, government agencies, or established scientific organizations, and cross-check the
> explanation where possible. Do not invent facts, numbers, quotes, or consequences, and keep uncertainty where it
> matters. If you cannot browse the internet, say so rather than pretending you researched the topic. Start the
> script immediately with a specific question or surprising statement, without a greeting or introduction. Build
> curiosity by explaining what would happen, why the obvious answer is wrong, or what makes the situation unusual,
> then deliver a clear, satisfying answer near the end. Build toward that answer without filler or dragging out
> the explanation. Use simple, natural, conversational English with short, connected sentences that sound good
> when spoken aloud. Every sentence should add useful information. Avoid generic hooks like "Did you know?", "This
> will blow your mind," or "You won't believe this." Avoid forced suspense, exaggerated claims, AI-sounding
> phrases, and calls to action. Use original wording and do not copy another creator's script. Choose the best
> idea yourself without asking me to pick a topic. In your response, give me a one-sentence description of the
> idea, the complete voiceover ready to record without scene directions, the narration word count, and links to
> the sources that support the explanation.

Deliver exactly: one-sentence idea, the voice-over (no scene directions), word count (count it with `wc -w`),
source links.

## Topic rules
- Format: an obvious-sounding fix ("why don't we just…?") plus a surprising, true reason it fails.
- Check `episodes.md` for every topic used or announced (including the brand bio's hurricane and trash-into-the-Sun)
  and avoid repeats and close variations. Rotate categories (space, animals, body, engineering, history, earth).
- Prefer topics with one clear visual mechanism (orbit speed, 90% underwater, melt in warm water...).
- Research several candidates, pick the strongest; the central fact must come from a primary source.

## Writing rules (Short, 60-70 s)
- 190-230 words. Tim Riley speaks ~165 wpm raw; after trimming pauses (cap 0.26 s) and `atempo=1.1` a 228-word
  script became 68.6 s. Plan the length with that in mind.
- First line = the question or surprising statement. Structure: hook → why it seems easy → 2-3 concrete reasons
  with numbers → the payoff line. Last line lands the joke/payoff (e.g. "The ice is free. Getting it into a tap is
  the hard part.").
- Plain words, short connected sentences, numbers spelled the way they should be spoken.
- Keep honest hedges ("about", "could", "roughly") where the source does.

## Long-form (5-7 min) from the same idea
- ~900-1,100 words (921 words → 5:33 at natural pace with pauses capped at 0.5 s, no speed-up).
- Shape used for "Why don't we just fire our trash into the Sun?":
  hook with the scale of the problem → the obvious fix → "it's hard, and not because of X" → mechanism explained
  simply with an everyday analogy (train) → a real-world proof (NASA Parker Solar Probe) → a strange consequence
  (easier to leave the solar system than to hit the Sun) → the math of doing it at scale (31 million launches) →
  risks (launch failures) → history (NASA nuclear-waste studies) → recap → the real fix on Earth → callback line.
- Write chapter-friendly sections; each becomes a YouTube chapter.
- Split the voice-over into takes under 5,000 characters at a section break.

## Fact-checking
- Keep a sources list per episode (title + URL) and use it for the description.
- If a source page is blocked in the cloud session, say which facts came from search snippets only and ask the
  user to open the links before publishing.
- Rough physics figures go on screen with a note ("rough figures"); payload figures state their condition
  ("in its strongest setup" for Falcon Heavy's ~64 t, which is without booster recovery).
