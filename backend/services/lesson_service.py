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
            AND status='active'
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

def get_active_objectives(cur, lesson_id):

    cur.execute("""
        SELECT id,order_index, title, description
        FROM objectives
        WHERE lesson_id = %s AND status = 'active'
        ORDER BY order_index;
    """, (lesson_id,))
    
    rows = cur.fetchall()

    return [
        {
            "objectiveId":r[0],
            "orderIndex": r[1],
            "title": r[2],
            "description": r[3]
        }
        for r in rows
    ]

def revise_with_ai(objectives, feedback):
    prompt = f"""
You are an instructional designer.

Current objectives:
{objectives}

User feedback:
{feedback}

Revise the objectives accordingly.

Return JSON:
{{
  "objectives": [
    {{
      "orderIndex": 1,
      "title": "...",
      "description": "..."
    }}
  ]
}}
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Return JSON only"},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )

    import json
    return json.loads(response.choices[0].message.content)["objectives"]

def replace_objectives(conn, lesson_id, new_objectives):
    cur = conn.cursor()
    # 1. soft delete old
    cur.execute("""
        UPDATE objectives
        SET status = 'deleted'
        WHERE lesson_id = %s AND status = 'active';
    """, (lesson_id,))

    # 2. insert new
    for obj in new_objectives:
        cur.execute("""
            INSERT INTO objectives (lesson_id, order_index, title, description, status)
            VALUES (%s, %s, %s, %s, 'active');
        """, (
            lesson_id,
            obj["orderIndex"],
            obj["title"],
            obj["description"]
        ))

    conn.commit()
    cur.close()


def generate_skills_from_objectives(objectives):
    prompt = f"""
You are an instructional designer.

For each learning objective below, generate 2–3 measurable skills.

Rules:
- Skills must be observable and measurable
- Use Bloom's taxonomy verbs
- Avoid vague topics (e.g., "data science")
- Keep 2–3 skills per objective
- Preserve objectiveId

Objectives:
{objectives}

Return JSON:
{{
  "objectiveSkills": [
    {{
      "objectiveId": 123,
      "skills": [
        {{
          "name": "...",
          "description": "...",
          "bloomLevel": "remember|understand|apply|analyze|evaluate|create"
        }}
      ]
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Return JSON only"},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )

    
    data = json.loads(response.choices[0].message.content)
    return data["objectiveSkills"]

def normalize_skill(skill):
    return {
        "name": skill["name"].lower().strip(),
        "description": skill["description"].strip(),
        "bloomLevel": skill.get("bloomLevel")
    }

def upsert_skill(cur, skill):
    cur.execute("""
        INSERT INTO skills (name, description)
        VALUES (%s, %s)
        ON CONFLICT (name)
        DO UPDATE SET description = EXCLUDED.description
        RETURNING id;
    """, (skill["name"], skill["description"]))

    row = cur.fetchone()

    if row:
        return row[0]

    # fallback
    cur.execute("SELECT id FROM skills WHERE name = %s", (skill["name"],))
    return cur.fetchone()[0]

def insert_mapping(cur, objective_id, skill_id):
    cur.execute("""
        INSERT INTO objective_skill_map (objective_id, skill_id)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
    """, (objective_id, skill_id))

def generate_and_store_skills_for_lesson(lesson_id):
    conn = get_connection()

    try:
        cur = conn.cursor()

        # 1. get objectives (now includes objectiveId)
        objectives = get_active_objectives(cur, lesson_id)

        # 2. LLM generate
        objective_skills = generate_skills_from_objectives(objectives)

        # 3. process each objective
        for obj in objective_skills:
            objective_id = obj["objectiveId"]

            for skill in obj["skills"]:
                s = normalize_skill(skill)

                # 4. upsert skill
                skill_id = upsert_skill(cur, s)

                # 5. map
                insert_mapping(cur, objective_id, skill_id)

        conn.commit()

    finally:
        conn.close()

def get_objectives_with_skills_db(cur, lesson_id):
    cur.execute("""
        SELECT 
            o.id AS objective_id,
            o.order_index,
            o.title,
            o.description,
            s.id AS skill_id,
            s.name AS skill_name
        FROM objectives o
        LEFT JOIN objective_skill_map osm ON o.id = osm.objective_id
        LEFT JOIN skills s ON osm.skill_id = s.id
        WHERE o.lesson_id = %s
          AND o.status = 'active'
        ORDER BY o.order_index;
    """, (lesson_id,))
    
    rows = cur.fetchall()

    result = {}

    for row in rows:
        obj_id = row[0]

        if obj_id not in result:
            result[obj_id] = {
                "objectiveId": obj_id,
                "orderIndex": row[1],
                "title": row[2],
                "description": row[3],
                "skills": []
            }

        if row[5]:
            result[obj_id]["skills"].append({
                "skillId": row[4],
                "name": row[5]
            })

    return list(result.values())