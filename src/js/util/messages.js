export const messages = [0, 1, 2].map((i) =>
  huginMessages[i].concat(muninMessages[i]),
);

const huginMessages = [
  // Immediate Alerts
  [
    "Hold, traveler! This land lies beyond your quest. Shall we return to our true mission?",
    "A single step off the path leads to many. Is this truly where you wish to go?",
    "Your quest lies elsewhere, yet here you stand. Shall we return before it is too late?",
    "Stay the course, traveler! The wisdom you seek is not here.",
  ],
  // Short Delay (5-10 Minutes)
  [
    "A moment’s detour can be forgiven… but wisdom calls you back. Will you answer?",
    "Your focus wanes, and the sands of time slip through your fingers. Will you reclaim them?",
    "Knowledge awaits, but you linger in the realm of distraction. Shall we continue your journey?",
  ],
  // Longer Delay (15+ Minutes)
  [
    "The Web of Distraction tightens around you. Break free, or be lost to its depths!",
    "Time is a river, and you are drifting. Swim back before the current takes you too far!",
    "Your journey was noble… until you got lost in the land of distractions. Return to the path!",
    "The wise know when to turn back. Do you?",
    "The Norns weave fate, but you have the power to shape yours. Make the right choice.",
  ],
].map((messagekind) => messagekind.map((message) => [message, "Huginn"]));

const muninMessages = [
  // Immediate Alerts
  [
    "Ooooh, shiny! A great distraction you’ve found! Too bad it won’t help you finish your work.",
    "Oh wow, a totally urgent detour, I’m sure. What’s next, scrolling ancient memes?",
    "Distraction detected! I repeat, distraction detected! Just kidding… but seriously, get back to work.",
    "Odin’s wisdom? Nah. You’re chasing cat videos instead.",
  ],
  // Short Delay (5-10 Minutes)
  [
    "Let me guess—you said ‘just a minute,’ and here we are. Classic.",
    "Ah, five minutes in. You’ve officially reached the ‘I’ll start soon’ phase. Classic move.",
    "Oh, I see… you're ‘taking a break.’ But from what, exactly?",
  ],
  // Longer Delay (15+ Minutes)
  [
    "At this rate, you should just add ‘Master of Procrastination’ to your résumé.",
    "Alright, at this point, even Odin himself would say ‘Wrap it up.’",
    "Honestly, I thought we were past this phase. You really are committed to avoiding work, huh?",
    "Look, I’m just a talking raven, but even I know this isn’t what you should be doing.",
    "Okay, let’s be real… are you researching procrastination techniques at this point?",
  ],
].map((messagekind) => messagekind.map((message) => [message, "Muninn"]));
