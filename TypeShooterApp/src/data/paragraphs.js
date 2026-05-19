/* Paragraphs pool — 60 curated entries, short→long */
export const PARAGRAPHS = [
  // Short / punchy (hard mode)
  "the quick brown fox jumps over the lazy dog and runs away",
  "pack my box with five dozen liquor jugs for the party tonight",
  "bright vixens jump dozing fowl quack across the muddy field",
  "how vexingly quick daft zebras jump over the sleeping fox here",
  "fix problem quickly with galvanized jets before the storm hits",
  "the five boxing wizards jump across the glowing digital stage",
  "jackdaws love my big sphinx of quartz near the old river bank",
  "we promptly judged antique ivory buckles for the next big show",
  "go lazy fat vixen be shrewd jump quickly defend your territory",
  "cozy lummox gives smart squid who asks for job penalties today",
  "the job requires extra pluck and zeal from every young worker",
  "quizzical twins proved my hijack bug fix worked on the server",
  "sixty zippers were quickly picked from the woven jute bag here",
  "sphinx of black quartz judge my vow and let the ceremony begin",
  "a wizard named kix quickly jumped on the flying zebra and flew",
  "jived fox nymphs grab quick waltz beats while the crowd cheers",
  "glib jocks quiz nymph to vex dwarf kings of the underground realm",
  "crazy fredrick bought many expensive jewels hidden in the vault",
  "we need to fix the blurry quadrant zones before jackpot expires",
  "the job requires extra pluck from every young wage-earning worker",
  // Medium
  "the early morning light filtered through the curtains as she sat thinking about everything ahead",
  "technology has changed how we communicate fundamentally altering the pace of information exchange",
  "learning to type quickly is one of the most valuable skills in the modern keyboard-driven world",
  "programming is the art of telling a machine what to do in a language it can actually understand",
  "she practiced every day improving her typing speed by ten words per minute each week of training",
  "the ancient library held thousands of books each a doorway into a world full of timeless wonder",
  "music has the power to evoke emotions that words alone cannot capture bringing people together",
  "the best way to learn a new skill is to practice deliberately pushing beyond your comfort zone",
  "scientists discovered that the human brain can form new neural connections well into old age",
  "the city never slept as millions of people went about their lives intersecting briefly in parks",
  "every character you type fires a bullet at the alien forces advancing toward your space shooter",
  "the history of the internet is a story of unexpected connections built by millions of people",
  "cooking is chemistry in the kitchen where heat transforms raw ingredients into complex flavors",
  "the spacecraft traveled through the void between stars for thousands of years carrying memories",
  "deep in the rainforest where the canopy filtered sunlight a researcher catalogued hidden species",
  "the difference between expert and novice is not talent but accumulated hours of focused practice",
  "waves crashed against the rocky shoreline while seabirds wheeled overhead in the salty grey air",
  "the philosopher argued that consciousness was woven into the very fabric of reality at every level",
  "she finished the last word of the paragraph and looked at her words per minute score in real time",
  "reading and typing are complementary skills that reinforce each other in a virtuous language cycle",
  // Long / flowing (survival)
  "in the beginning there was a blank canvas and from that blankness emerged every story ever told every song ever sung every painting ever made by human hands reaching for something beyond the ordinary rhythm of daily life",
  "the astronaut floated in the observation module watching the curve of the earth rotating slowly below and felt for the first time in her life that she understood what it meant to be small and temporary and precious",
  "there is a particular kind of silence that descends on a library after closing time when the last reader has gone and the books stand waiting in their orderly rows full of worlds and voices and ideas that survived centuries",
  "the programmer stared at the screen for the fourth hour in a row tracing through the logic of a function that refused to behave and then with the clarity that comes from exhaustion saw the problem and fixed it in three keystrokes",
  "to understand typing speed you must first understand that the brain does not process each character individually but rather chunks familiar sequences into single cognitive units which is why common words flow faster than rare ones",
  "the village had no electricity and the nights were lit only by oil lamps and stars and the people gathered in the evenings to tell stories that had been passed down through generations each retelling adding a new layer of meaning",
  "she had been practicing typing every morning for three months and the improvement was remarkable but what surprised her most was that the practice had changed more than just her fingers it had sharpened her attention and patience",
  "the ocean is a reminder that most of our planet remains unexplored with creatures living at depths where pressure would crush any unprotected human and moving through total darkness guided by senses evolved over millions of years",
  "code is a form of writing and like all writing it benefits from clarity and precision and the willingness to revise and the understanding that the first version of anything is rarely the best version as requirements change over time",
  "the rain had been falling for three days turning the garden into a small lake and the children pressed their faces against the window glass watching the water and asking when they could go outside and the answer came on day four",
  "reading and typing are complementary skills that reinforce each other because reading builds the vocabulary that makes typing faster while typing reinforces the correct spelling that reading has introduced creating a virtuous cycle",
  "the old map on the wall showed a world that no longer existed with borders long dissolved and cities renamed and it occurred to the traveler that every map is already a record of the past slipping away into history before we notice",
  "in competitive typing the difference between sixty and eighty words per minute is not raw speed but the elimination of hesitation between words and the reduction of error correction time which requires not faster fingers but a calmer mind",
  "the engineer designed the bridge to last one hundred years accounting for earthquake and flood and the slow subsidence of the earth beneath the foundations knowing that long after she was gone the work would carry people safely across",
  "every sentence is a puzzle assembled from words which are themselves patterns of sounds that humans agreed long ago would carry specific meanings and this agreement is so deep that we no longer notice it as we read and speak and think",
  "the tournament had been running for six hours and the top typists sat in quiet focus their fingers moving across mechanical keyboards at speeds that seemed impossible to the spectators gathered in the gallery watching in silence",
  "autumn came early that year stripping the trees before the end of August and sending a chill through the valley that made residents feel the year had decided to skip the gentle transition and move straight to the grey mood of November",
  "the idea that practice makes perfect is only half true because unfocused practice simply reinforces existing habits and what actually improves performance is deliberate practice with specific targets and immediate feedback every day",
  "somewhere in the server rack a process was running that had been started three years ago and forgotten faithfully doing its job consuming barely any resources while the world changed and the people who wrote it moved on entirely",
  "the typewriter was invented to help a man going blind write without seeing the page and in solving one problem its inventors accidentally gave the world a technology that would reshape commerce and eventually become your keyboard",
]

export function getParagraph(diff) {
  let pool
  if (diff === 'hard')     pool = PARAGRAPHS.slice(0, 20)
  else if (diff === 'medium') pool = PARAGRAPHS.slice(20, 40)
  else                        pool = PARAGRAPHS.slice(20)
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getRandomParagraph() {
  return PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)]
}
