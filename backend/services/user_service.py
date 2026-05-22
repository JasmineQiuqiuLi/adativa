import bcrypt
import psycopg2
from fastapi import HTTPException
from database.db import get_connection

def hash_password(plain:str)->str:
    return bcrypt.hashpw(
        plain.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

def verify_password(plain:str,hashed:str)->bool:
    return bcrypt.checkpw(
        plain.encode("utf-8"),
        hashed.encode("utf-8")
    )

def register_user(email:str,password:str,display_name:str|None=None)->dict:
    conn=get_connection()
    try:
        cur=conn.cursor()
        try:
            cur.execute("""
                INSERT INTO users (email, password_hash,display_name)
                VALUES (%s, %s, %s) 
                RETURNING id,email,display_name 
            """,(email,hash_password(password),display_name))
            row=cur.fetchone()
            conn.commit()
            return {
                "id":row[0],
                "email":row[1],
                "display_name":row[2]
            }

        except psycopg2.errors.UniqueViolation:
                    conn.rollback()
                    raise HTTPException(
                        status_code=409,
                        detail="Email already registered"
                    )
    finally:
         cur.close()
         conn.close()

def authenticate_user(email: str, password: str) -> dict | None:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, email, display_name, password_hash
            FROM users
            WHERE email = %s;
        """, (email,))
        row = cur.fetchone()
        if not row:
            return None

        user_id, user_email, display_name, password_hash = row
        if not verify_password(password, password_hash):
            return None

        return {
            "id": user_id,
            "email": user_email,
            "display_name": display_name,
        }
    finally:
        cur.close()
        conn.close()