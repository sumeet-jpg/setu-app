export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readMins: number
  body: { heading?: string; paragraphs?: string[]; list?: string[] }[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ai-employee-vs-human-hire-real-cost',
    title: 'The real cost of an AI Employee vs. a human hire',
    description: 'Base salary is the smallest line item. PF, recruitment, notice periods, and the six months of ramp time nobody budgets for — the actual math on hiring in India in 2026.',
    date: '2026-08-21',
    readMins: 6,
    body: [
      {
        paragraphs: [
          'Every hiring decision gets evaluated on one number: the salary. That number is the smallest part of the real cost, and it\'s the reason "just hire someone" sounds cheaper than it is.',
          'Take a Marketing Manager in India — a real, common hire for a growing company. The offer letter says ₹8L/year. The actual first-year cost looks more like ₹10L: add ₹96k in PF (12% employer contribution), ₹1L+ in recruitment (agency fees or the weeks of internal time spent screening), and that\'s before the position has produced a single campaign.',
        ],
      },
      {
        heading: 'The costs that never make it into the offer letter',
        paragraphs: ['None of these show up in a job posting, but they show up on the P&L:'],
        list: [
          'Recruitment & interviews — ₹50k–₹2L per hire in agency fees or lost internal hours',
          'Benefits & PF — an automatic 12–20% on top of base salary',
          'Notice period before they even start — 30–90 days of the role sitting empty',
          'Ramp time — 3–6 months before a new hire is producing at full capacity',
          'Downtime — 15–30 days/year in planned and unplanned leave',
          'Knowledge loss on exit — whatever they knew leaves with them, often with no handover',
        ],
      },
      {
        heading: 'What actually changes the math',
        paragraphs: [
          'An AI Employee doesn\'t eliminate the need for marketing leadership, sales execution, or financial oversight — it changes what those functions cost to run. At $49/month (~₹4,100/month), a role that would otherwise cost ₹10L+/year in fully-loaded human cost runs at roughly ₹49,000/year. That\'s not a 20% discount. It\'s a different order of magnitude, which is why the honest comparison isn\'t "AI vs. human" as a philosophy — it\'s a specific number against a specific number.',
          'The right way to think about it: an AI Employee doesn\'t replace judgment, relationships, or the parts of a role that genuinely need a human in the room. It replaces the parts of the cost structure — headcount overhead, ramp time, notice periods — that were never actually about the work.',
        ],
      },
    ],
  },
  {
    slug: 'i-used-an-ai-cmo-for-30-days',
    title: 'I used an AI CMO for 30 days. Here\'s what actually happened.',
    description: 'A first-person account of hiring Setu\'s AI CMO for a real business — what it got right on day one, where it needed correction, and whether it\'s a real substitute for a marketing hire.',
    date: '2026-08-20',
    readMins: 7,
    body: [
      {
        paragraphs: [
          'The honest starting point: I was skeptical. "AI CMO" sounds like a category built for a demo, not a business. The test was simple — hire it, use it for a real month of actual marketing work, and see what breaks.',
        ],
      },
      {
        heading: 'Week 1: the interview mattered more than I expected',
        paragraphs: [
          'Setu\'s whole pitch is that you interview before you hire — no sales call, just a live chat with the actual employee. I used it to stress-test positioning questions I\'d normally save for a second-round interview: how would you handle a shrinking budget, what would you cut first, what\'s your read on our category. The answers weren\'t generic marketing-speak — they were specific to what I\'d described about the business, which is the bar that matters. A canned answer here would have ended the experiment before it started.',
        ],
      },
      {
        heading: 'Week 2–3: real output, real correction cycles',
        paragraphs: [
          'This is where most AI tools fall apart — the first draft is fine, the fifth draft hasn\'t improved. What was different here: after uploading a brand voice doc and correcting a couple of early misses (too formal, wrong emphasis on a feature nobody asked about), later output actually reflected the correction. Whether that\'s "memory" in some deep sense or just good context engineering doesn\'t matter for the result — the trend line pointed the right direction, which is the only thing that matters in a real workflow.',
          'Where it needed a human: anything requiring a judgment call with real stakes attached — a pricing change, a partnership decision, language that could be read as a claim we couldn\'t back up. The action-approval flow (it proposes, you approve before anything goes out) is doing real work here, not just theater.',
        ],
      },
      {
        heading: 'Week 4: the actual verdict',
        paragraphs: [
          'Thirty days in, the honest answer is: it\'s not a replacement for a CMO who owns the whole strategic relationship with a board. It is a genuinely useful replacement for the specific, constant grind of execution — the campaign briefs, the weekly reporting, the first-draft everything — that eats most of a marketing hire\'s actual week regardless of their seniority.',
          'At $49/month against what a real marketing hire costs fully loaded, the question isn\'t "is this as good as a human." It\'s "is this good enough to be worth trying before spending six figures on a hire I might get wrong." For that question, 30 days was enough to say yes.',
        ],
      },
    ],
  },
  {
    slug: 'ai-cfo-vs-hiring-a-cfo-in-india',
    title: 'AI CFO vs. hiring a CFO in India: the real trade-offs',
    description: 'What a fractional or full-time CFO hire actually costs in India, what an AI CFO can and can\'t do instead, and where the line genuinely sits.',
    date: '2026-08-19',
    readMins: 6,
    body: [
      {
        paragraphs: [
          'A full-time CFO hire in India for a growing business runs ₹25L+ base salary, often with an ESOP component on top, plus a 120-day notice period that means the search-to-start timeline can stretch past six months. Even before that person makes a single decision, the company has committed to a significant fixed cost and a long runway to fill the seat.',
        ],
      },
      {
        heading: 'What a CFO role actually breaks down into',
        paragraphs: [
          'Strip away the title and the job is a mix of things that need genuine judgment (fundraising strategy, board relationships, high-stakes negotiation) and things that are structured, repeatable work (cash flow forecasting, monthly close, scenario modeling, investor reporting formats). The first category is where a human CFO earns their equity. The second category is where most of the actual hours go.',
        ],
      },
      {
        heading: 'Where an AI CFO genuinely helps',
        list: [
          'Cash flow forecasting and runway modeling — structured, data-driven, and available on demand rather than on a monthly cadence',
          'Board-ready reporting — the format and rigor without waiting on a person\'s calendar',
          'Scenario modeling — "what if we cut spend 20%" answered in minutes, not a week',
          'No equity dilution and no 120-day notice period standing between deciding you need this and having it',
        ],
      },
      {
        heading: 'Where it doesn\'t',
        paragraphs: [
          'Sitting across the table from an investor during a term sheet negotiation, reading a board member\'s unstated concern in a meeting, making the call on a genuinely ambiguous strategic bet — that\'s not a structured-data problem, and pretending an AI tool solves it would be dishonest. The honest positioning is: an AI CFO handles the volume of structured financial work a real company generates every week, freeing a founder (or an actual CFO, once you can afford one) to spend their time on the handful of decisions that actually need a human in the room.',
          'For a company not yet at the size where a ₹25L+ fully-loaded CFO hire makes sense, that\'s not a compromise — it\'s the only way to get CFO-level financial rigor at all.',
        ],
      },
    ],
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug)
}
