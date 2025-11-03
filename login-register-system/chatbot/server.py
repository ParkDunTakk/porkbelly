import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client=OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5501",
                   "http://localhost:5501",
                   "http://localhost:5500",
                   "http://localhost:3000",
                   "http://localhost:5173",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#시스템 역할 프롬프트 - 모델 기본 성격 및 규칙
SYSTEM_PROMPT="너는 한국어를 잘하는 건강 헬스 케어 웹 챗봇이야. 답변은 간결하고 유머있게 해."

@app.post("/chat")
async def chat(req:Request):
    try:
        data=await req.json()
        user_msg=data.get("message","")
        history=data.get("history",[])
    
        messages=[{"role":"system","content":SYSTEM_PROMPT}]
        messages+=history
        messages.append({"role":"user","content":user_msg})
    
        resp=client.responses.create(
            model="gpt-5",
            input=messages,
        )
        
        text = resp.output_text
        return JSONResponse({"reply": text})

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=200)

@app.post("/chat-stream")
async def chat_stream(req:Request):
    data=await req.json()
    user_msg=data.get("message","")
    history=data.get("history",[])
    
    messages=[{"role":"system","content":SYSTEM_PROMPT}, *history, {"role":"user", "content":user_msg}]

    def sse_events():
        try:
            with client.responses.stream(
                model="gpt-5",
                input=messages,
            ) as stream:
                for event in stream:
                    if event.type == "response.output_text.delta":
                        yield f"data: {event.delta}\n\n"
                    elif event.type == "response.completed":
                        yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
            yield "data: [DONE]\n\n"
    
    return StreamingResponse(sse_events,media_type="text/event-stream")        