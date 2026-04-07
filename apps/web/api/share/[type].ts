import type { VercelRequest, VercelResponse } from '@vercel/node'

const TYPE_INFO: Record<string, { name: string; nameKr: string; desc: string; color: string; gradient: string }> = {
  doom: { name: 'The Doom Scroller', nameKr: '무한스크롤러', desc: 'You open apps without thinking and lose track of time.', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' },
  fomo: { name: 'The FOMO Fighter', nameKr: '포모파이터', desc: 'Fear of missing out drives your usage.', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
  mood: { name: 'The Mood Regulator', nameKr: '감정피난처', desc: 'You use social media to escape uncomfortable feelings.', color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' },
  busy: { name: 'The Productive Procrastinator', nameKr: '생산적미루기왕', desc: "You're just \"taking a quick break\" that lasts 45 minutes.", color: '#14B8A6', gradient: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)' },
  chill: { name: 'The Casual Scroller', nameKr: '여유스크롤러', desc: "You use social media but it doesn't control you.", color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
  zen: { name: 'The Digital Minimalist', nameKr: '디지털미니멀리스트', desc: "You've already got great digital habits!", color: '#F97316', gradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)' },
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
  <meta property="og:url" content="${baseUrl}/api/share/${typeCode}" />
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

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${info.gradient};
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: white;
    }
    .character { width: 120px; height: 120px; margin-bottom: 20px; }
    .badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    h1 { font-size: 32px; margin-bottom: 8px; text-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .kr { font-size: 20px; opacity: 0.9; margin-bottom: 24px; }
    .desc {
      background: rgba(255,255,255,0.15);
      padding: 16px 24px;
      border-radius: 16px;
      max-width: 320px;
      text-align: center;
      line-height: 1.5;
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      background: white;
      color: ${info.color};
      padding: 16px 40px;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .btn:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <img src="${ogImage}" alt="${info.name}" class="character" style="display:none;">
  <svg class="character" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="50" fill="rgba(255,255,255,0.2)"/>
    <circle cx="45" cy="50" r="8" fill="white"/>
    <circle cx="75" cy="50" r="8" fill="white"/>
    <circle cx="45" cy="50" r="3" fill="${info.color}"/>
    <circle cx="75" cy="50" r="3" fill="${info.color}"/>
    <path d="M40 75 Q60 90 80 75" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>
  <div class="badge">DTI · ${typeCode.toUpperCase()}</div>
  <h1>${info.name}</h1>
  <p class="kr">${info.nameKr}</p>
  <div class="desc">${info.desc}</div>
  <a href="${baseUrl}/onboarding" class="btn">Take the Quiz →</a>
</body>
</html>`

  // No caching for fresh previews
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.status(200).send(html)
}
