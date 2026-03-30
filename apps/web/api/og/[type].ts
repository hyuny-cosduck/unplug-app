import type { VercelRequest, VercelResponse } from '@vercel/node'

const TYPE_INFO: Record<string, { name: string; nameKr: string; desc: string }> = {
  doom: { name: 'The Doom Scroller', nameKr: '무한스크롤러', desc: 'You open apps without thinking and lose track of time.' },
  fomo: { name: 'The FOMO Fighter', nameKr: '포모파이터', desc: 'Fear of missing out drives your usage.' },
  mood: { name: 'The Mood Regulator', nameKr: '감정피난처', desc: 'You use social media to escape uncomfortable feelings.' },
  busy: { name: 'The Productive Procrastinator', nameKr: '생산적미루기왕', desc: 'You\'re just "taking a quick break" that lasts 45 minutes.' },
  chill: { name: 'The Casual Scroller', nameKr: '여유스크롤러', desc: 'You use social media but it doesn\'t control you.' },
  zen: { name: 'The Digital Minimalist', nameKr: '디지털미니멀리스트', desc: 'You\'ve already got great digital habits!' },
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { type } = req.query
  const typeCode = (typeof type === 'string' ? type : type?.[0] || 'doom').toLowerCase()
  const info = TYPE_INFO[typeCode] || TYPE_INFO.doom

  const baseUrl = 'https://unplug-together.vercel.app'
  const ogImage = `${baseUrl}/og/${typeCode}.png`
  const pageUrl = `${baseUrl}/result/${typeCode.toUpperCase()}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My DTI: ${typeCode.toUpperCase()} - ${info.name} | Unplug</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${pageUrl}" />
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

  <!-- JS redirect (crawlers won't execute, users will) -->
  <script>window.location.replace("${pageUrl}")</script>
</head>
<body>
  <p>Loading your result... <a href="${pageUrl}">Click here</a> if not redirected.</p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(html)
}
