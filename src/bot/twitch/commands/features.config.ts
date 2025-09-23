/**
 * Feature toggles for command groups
 * Set to false to disable an entire feature set
 */

export const features = {
  core: true,        // cute, punt, slap
  quotes: true,      // quote
  ai: true,          // analyze
  ffbot: true,       // stats, ffrefresh (using synthform API)
  campaign: true,    // campaign, subathon, milestones, timer, etc.
  honors: true,      // heykay, heymoral, heymyri
} as const
