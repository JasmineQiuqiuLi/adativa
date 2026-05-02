from openai import OpenAI
import os
from dotenv import load_dotenv
import logging

logger=logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

load_dotenv()

OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")
client=OpenAI(api_key=OPENAI_API_KEY)

def get_openai_client():
    logger.info("load openai client")
    return client

if __name__=="__main__":
    get_openai_client()