/** MDX-style blog posts (markdown content rendered client-side). */
export interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
  suburb: string
  content: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'coastal-roofing-perth',
    title: 'Coastal Roofing in Perth: Why Colorbond Ultra Matters',
    date: '2026-11-01',
    excerpt: 'AS/NZS 2728 severe marine zones explained for Fremantle, Cottesloe and Scarborough homeowners.',
    suburb: 'Fremantle',
    content: `# Coastal Roofing in Perth

Homes within 1km of the surf face **severe marine corrosion**. AS/NZS 2728 requires upgraded materials.

## What we recommend

- Colorbond Ultra steel
- Class 4 / Stainless 316 fasteners
- Annual inspection of flashings

Contact us for a free coastal assessment.`,
  },
  {
    slug: 'roof-pitch-explained',
    title: 'Roof Pitch Explained: How It Changes Your Quote',
    date: '2026-10-20',
    excerpt: 'A 22° roof is not the same area as a flat roof — here is the maths we use.',
    suburb: 'Perth',
    content: `# Roof Pitch Explained

True roof area = **Plan Area x (1 / cos(pitch)) x (1 + waste)**.

## Why it matters

A 30° roof needs ~15% more material than a flat roof of the same footprint. Our estimator calculates this automatically.`,
  },
  {
    slug: 'storm-season-checklist',
    title: 'Perth Storm Season: 7-Point Roof Checklist',
    date: '2026-10-05',
    excerpt: 'Before the winter storms arrive, check these seven items on your roof.',
    suburb: 'Perth',
    content: `# Storm Season Checklist

1. Clear gutters and downpipes
2. Check ridge capping mortar
3. Inspect flashings
4. Look for cracked tiles
5. Trim overhanging branches
6. Check roof ventilation
7. Book a professional inspection`,
  },
]
