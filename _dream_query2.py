import sqlite3, json

DB = r"C:\Users\Kostya23\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(DB)
cur = conn.cursor()

# Get deploy results from the settings session
cur.execute("""
    SELECT json_extract(p.data, '$.state.input.command'), json_extract(p.data, '$.state.output')
    FROM part p
    JOIN message m ON p.message_id = m.id
    WHERE m.session_id = 'ses_0a9d1b144ffeElHQyWJll3R55o'
      AND json_extract(p.data, '$.tool') = 'bash'
      AND json_extract(p.data, '$.state.input.command') LIKE '%git commit%'
    ORDER BY m.time_created DESC
    LIMIT 5
""")
for r in cur.fetchall():
    cmd = r[0] or ""
    out = (r[1] or "")[:300]
    print(f"CMD: {cmd}")
    print(f"OUT: {out}")
    print("---")

# Check last few commits in repo
print("\n=== Recent commits from latest session ===")
cur.execute("""
    SELECT json_extract(p.data, '$.state.input.command'), json_extract(p.data, '$.state.output')
    FROM part p
    JOIN message m ON p.message_id = m.id
    WHERE m.session_id = 'ses_0a9d1b144ffeElHQyWJll3R55o'
      AND json_extract(p.data, '$.tool') = 'bash'
      AND json_extract(p.data, '$.state.input.command') LIKE '%git log%'
    ORDER BY m.time_created DESC
    LIMIT 5
""")
for r in cur.fetchall():
    cmd = r[0] or ""
    out = (r[1] or "")[:600]
    print(f"CMD: {cmd}")
    print(f"OUT: {out}")
    print("---")

# Also check the "Commit current state" session
print("\n=== Commits from ses_0a9d1b144ffeElHQyWJll3R55o deploy ===")
cur.execute("""
    SELECT json_extract(p.data, '$.state.input.command'), json_extract(p.data, '$.state.output')
    FROM part p
    JOIN message m ON p.message_id = m.id
    WHERE m.session_id = 'ses_0a9d1b144ffeElHQyWJll3R55o'
      AND json_extract(p.data, '$.tool') = 'bash'
      AND (json_extract(p.data, '$.state.input.command') LIKE '%deploy%'
           OR json_extract(p.data, '$.state.input.command') LIKE '%vercel%')
    ORDER BY m.time_created DESC
    LIMIT 5
""")
for r in cur.fetchall():
    cmd = r[0] or ""
    out = (r[1] or "")[:600]
    print(f"CMD: {cmd}")
    print(f"OUT: {out}")
    print("---")

conn.close()
