import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

def get_connection():
    return psycopg2.connect(
        os.getenv("DATABASE_URL"),
        sslmode="require"
    )


def create_lesson():
    query="""
    INSERT INTO lessons (goal, age_range,style, pace)
    VALUES (%s,%s,%s, %s)
    RETURNING id;
"""
    cur.execute(query,(
        "learn python data analysis",
        "9-12",
        "mixed",
        "intensive"
    ))

    lesson_id=cur.fetchone()[0]

    conn.commit()

    cur.close()
    conn.close()

    print(lesson_id)

if __name__=="__main__":
    create_lesson()
