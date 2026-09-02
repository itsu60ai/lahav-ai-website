-- F-46 follow-up 2: the two channels the client asked for, plus similar
-- active Israeli tech/AI channels found by search. Every channel_id was
-- resolved live and its feed's most recent <entry> date was checked
-- before it was added, so nothing stale or empty made the list.
INSERT INTO ai_radar_sources (id, name, url, topic, active, created_at) VALUES
('yt-letsai', 'Let''s AI', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCw9pDOWLJmhJ4BK_CH8pWsw', 'AI חדשות ועדכונים (עברית)', 1, '2026-09-02T00:00:00.000Z'),
('yt-eilon-grouper', 'איילון גרופר', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCca59HweyXIyxb3gUwA995w', 'AI כלים והדרכות (עברית)', 1, '2026-09-02T00:00:00.000Z'),
('yt-geektime', 'GeekTime TV', 'https://www.youtube.com/feeds/videos.xml?channel_id=UCoy91UfDRwClqrd7eu3wwMQ', 'טכנולוגיה וחדשות AI (עברית)', 1, '2026-09-02T00:00:00.000Z'),
('yt-eyal-marcus', 'Eyal Marcus', 'https://www.youtube.com/feeds/videos.xml?channel_id=UC5Td0wCkGbYy1SJz9EkW-BQ', 'כלי AI (עברית)', 1, '2026-09-02T00:00:00.000Z');
