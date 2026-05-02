from clients.openai_client import get_openai_client
from models.schemas import GeneratedObjective,CreateLessonResponse,LessonAIOutput
import json
from typing import List
from database.db import get_connection

client=get_openai_client()

def generate_objectives(goal,age_range,style,pace) -> CreateLessonResponse:
    prompt=f"""
You are an expert instructional designer.
create a learning palan.
Goal: {goal}
Age range: {age_range}
style:{style}
pace:{pace}

return ONLY valid JSON in this format:
{{
    "lessonTitle":"...",
    "objectives":[
        {{
            "orderIndex":1,
            "title":"...",
            "description:"..."
        }}
    ]
}}
"""
    response=client.chat.completions.create(
        model='gpt-4o-mini',
        messages=[
            {"role":"system","content":"You must return valid JSON only"},
            {"role":"user","content":prompt},
        ],
        temperature=0.7,
        response_format={"type":"json_object"}
    )

    content=response.choices[0].message.content

    data=json.loads(content)

    return LessonAIOutput(**data)


def save_lesson_to_db(goal,age_range,style,pace,objectives):
    conn=get_connection()
    cur=conn.cursor()

    query_lessons=f"""
    INSERT INTO lessons (goal,age_range,style,pace)
    VALUES (%s,%s, %s, %s)
    RETURNING id;
"""
    try:
        # step 1: insert lesson
        cur.execute(query_lessons,(goal,age_range,style,pace))
        lesson_id=cur.fetchone()[0]

        # step 2: insert objectives
        query_objectives=f"""
        INSERT INTO objectives (lesson_id,order_index,title,description)
        VALUES (%s, %s, %s, %s)
"""
        for obj in objectives:
            cur.execute(query_objectives,(
                lesson_id,
                obj['orderIndex'],
                obj['title'],
                obj['description']
            ))
        conn.commit()
        return lesson_id
    
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def get_lesson_by_id(lesson_id:int):
    conn=get_connection()
    cur=conn.cursor()
    objective_query=f"""
        SELECT goal
        FROM lessons
        WHERE id=%s;
    """
    try:
        cur.execute(objective_query,(lesson_id,))
        lesson=cur.fetchone()

        if not lesson:
            return None
        lesson_title=lesson[0]

        # get objectives
        cur.execute("""
            SELECT order_index,title,description
            FROM objectives
            WHERE lesson_id=%s
            ORDER BY order_index
        """,(lesson_id,))
        rows=cur.fetchall()

        objectives=[
            {
                "orderIndex":row[0],
                "title":row[1],
                "description":row[2]
            }
            for row in rows
        ]
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

    return {
        "lessonTitle":lesson_title,
        "objectives": objectives
    }