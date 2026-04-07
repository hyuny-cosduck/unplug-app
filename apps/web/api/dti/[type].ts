import type { VercelRequest, VercelResponse } from '@vercel/node'

// Colors must match Onboarding.tsx PERSONALITY_TYPES
const TYPE_INFO: Record<string, { name: string; nameKr: string; desc: string; color: string; gradient: string }> = {
  doom: { name: 'The Doom Scroller', nameKr: '무한스크롤러', desc: 'You open apps without thinking and lose track of time.', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' },
  fomo: { name: 'The FOMO Fighter', nameKr: '포모파이터', desc: 'Fear of missing out drives your usage.', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
  mood: { name: 'The Mood Regulator', nameKr: '감정피난처', desc: 'You use social media to escape uncomfortable feelings.', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' },
  busy: { name: 'The Productive Procrastinator', nameKr: '생산적미루기왕', desc: "You're just \"taking a quick break\" that lasts 45 minutes.", color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' },
  chill: { name: 'The Casual Scroller', nameKr: '여유스크롤러', desc: "You use social media but it doesn't control you.", color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
  zen: { name: 'The Digital Minimalist', nameKr: '디지털미니멀리스트', desc: "You've already got great digital habits!", color: '#6366F1', gradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' },
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { type } = req.query
  const typeCode = (typeof type === 'string' ? type : type?.[0] || 'doom').toLowerCase()
  const info = TYPE_INFO[typeCode] || TYPE_INFO.doom

  const baseUrl = 'https://unplug-together.vercel.app'
  const ogImage = `${baseUrl}/og/${typeCode}.png`

  // Minimal HTML with OG tags for social preview, then immediate redirect to quiz
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My DTI: ${typeCode.toUpperCase()} - ${info.name} | Unplug</title>

  <!-- Open Graph for social previews -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${baseUrl}/api/dti/${typeCode}" />
  <meta property="og:title" content="My DTI: ${typeCode.toUpperCase()} - ${info.name}" />
  <meta property="og:description" content="${info.desc} ${info.nameKr}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="My DTI: ${typeCode.toUpperCase()} - ${info.name}" />
  <meta name="twitter:description" content="${info.desc}" />
  <meta name="twitter:image" content="${ogImage}" />

  <!-- Immediate redirect to quiz -->
  <meta http-equiv="refresh" content="0;url=${baseUrl}/onboarding">
  <script>window.location.replace("${baseUrl}/onboarding")</script>
</head>
<body>
  <p>Redirecting to quiz...</p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.status(200).send(html)
}
