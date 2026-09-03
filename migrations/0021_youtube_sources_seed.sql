-- F-46 follow-up: seed ai_radar_sources with real, verified YouTube
-- channel feeds (official Google RSS, https://www.youtube.com/feeds/
-- videos.xml?channel_id=...). Every channel_id below was resolved from
-- the channel's live page and the resulting feed URL was fetched and
-- confirmed to return the right channel title on 2026-09-02.
INSERT INTO ai_radar_sources (id, name, url, topic, active, created_at) VALUES
('yt-digimate', 'Digimate - Rani Ifrah (עברית)', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCe10RuK1zUJ7kOgbhNBq9Kw', 'AI בעברית, כלים והדרכות', 1, '2026-09-02T00:00:00.000Z'),
('yt-two-minute-papers', 'Two Minute Papers', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCbfYPyITQ-7l4upoX8nvctg', 'AI research', 1, '2026-09-02T00:00:00.000Z'),
('yt-matt-wolfe', 'Matt Wolfe', 'https://www.youtube.com/feeds/videos.xml?channel_id=UChpleBmo18P08aKCIgti38g', 'AI tools news', 1, '2026-09-02T00:00:00.000Z'),
('yt-wes-roth', 'Wes Roth', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCqcbQf6yw5KzRoDDcZ_wBSw', 'AI news', 1, '2026-09-02T00:00:00.000Z'),
('yt-ai-advantage', 'The AI Advantage', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCHhYXsLBEVVnbvsq57n1MTQ', 'AI for business', 1, '2026-09-02T00:00:00.000Z'),
('yt-ai-explained', 'AI Explained', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCNJ1Ymd5yFuUPtn21xtRbbw', 'AI analysis', 1, '2026-09-02T00:00:00.000Z');
