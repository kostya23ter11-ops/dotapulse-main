import sqlite3
import sys

DB = r"C:\Users\Kostya23\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(DB)
cur = conn.cursor()
cmd = sys.argv[1] if len(sys.argv) > 1 else "sessions"

if cmd == "sessions":
    cur.execute("SELECT id, directory, title, time_created FROM session ORDER BY time_created DESC LIMIT 20")
    for r in cur.fetchall():
        title = (r[2] or "")[:70]
        print(f"{r[0]} | {r[1]} | {title} | {r[3]}")

elif cmd == "session_messages":
    sid = sys.argv[2]
    cur.execute("""
        SELECT m.id, m.agent_id,
               json_extract(p.data, '$.type') as part_type,
               json_extract(p.data, '$.tool') as tool,
               substr(p.data, 1, 600) as preview
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ?
          AND json_extract(m.data, '$.role') = 'assistant'
        ORDER BY m.time_created, p.time_created
    """, (sid,))
    for r in cur.fetchall():
        print(f"msg={r[0][:12]} agent={r[1] or 'main'} | type={r[2]} tool={r[3]} | {r[4][:200]}")

elif cmd == "user_search":
    term = sys.argv[2]
    cur.execute("""
        SELECT m.session_id, substr(json_extract(m.data, '$.content'), 1, 300)
        FROM message m
        WHERE json_extract(m.data, '$.role') = 'user'
          AND json_extract(m.data, '$.content') LIKE ?
        ORDER BY m.time_created DESC
        LIMIT 20
    """, (f"%{term}%",))
    for r in cur.fetchall():
        print(f"sid={r[0][:16]} | {r[1]}")

elif cmd == "table_list":
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    for r in cur.fetchall():
        print(r[0])

elif cmd == "message_count":
    cur.execute("SELECT session_id, COUNT(*) FROM message GROUP BY session_id ORDER BY COUNT(*) DESC LIMIT 20")
    for r in cur.fetchall():
        print(f"{r[0]}: {r[1]} messages")

elif cmd == "checkpoints":
    cur.execute("""
        SELECT m.session_id, substr(json_extract(p.data, '$.text'), 1, 400)
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(p.data, '$.type') = 'checkpoint'
        ORDER BY m.time_created DESC
        LIMIT 10
    """)
    for r in cur.fetchall():
        print(f"sid={r[0][:16]} | {r[1][:300]}")

elif cmd == "all_parts_for_session":
    sid = sys.argv[2]
    cur.execute("""
        SELECT m.id, m.agent_id, m.time_created,
               json_extract(m.data, '$.role') as role,
               json_extract(p.data, '$.type') as part_type,
               json_extract(p.data, '$.tool') as tool,
               substr(p.data, 1, 800) as preview
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ?
        ORDER BY m.time_created, p.time_created
    """, (sid,))
    for r in cur.fetchall():
        print(f"msg={r[0][:12]} agent={r[1] or 'main'} time={r[2]} role={r[3]} type={r[4]} tool={r[5]} | {r[6][:250]}")

conn.close()
