import os
from flask import Flask, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
from flask_cors import CORS # 👈 1. CORS 모듈 import

# .env 파일에서 환경 변수를 로드
load_dotenv() 

# ----------------------------------------------------
# 🔑 API 키 설정: 환경 변수(OPENAI_API_KEY)를 자동으로 사용합니다.
# ----------------------------------------------------
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    # 키가 설정되지 않았다면 오류를 발생시킵니다.
    raise ValueError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.")

client = OpenAI(api_key=api_key)

app = Flask(__name__)
CORS(app) # 👈 2. Flask 앱에 CORS 설정 적용 (모든 출처 허용)

# 대화 맥락(Context)을 저장할 임시 저장소 (세션 관리)
chat_sessions = {}


@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """
    POST 요청을 처리하여 챗봇 응답을 생성하는 API 엔드포인트
    """
    try:
        # 1. 요청 데이터 받기
        data = request.get_json()
        user_message = data.get('message')
        session_id = data.get('session_id', 'default_user') 
        
        if not user_message:
            return jsonify({"error": "메시지 내용이 필요합니다."}), 400

        # 2. 대화 맥락(messages) 관리
        if session_id not in chat_sessions:
            # 새로운 세션의 경우 시스템 프롬프트로 초기화
            chat_sessions[session_id] = [
                {"role": "system", "content": "당신은 사용자에게 웹 개발에 대해 친절하게 답변하는 AI 챗봇입니다."}
            ]
        
        # 현재 사용자 메시지를 맥락에 추가
        current_messages = chat_sessions[session_id]
        current_messages.append({"role": "user", "content": user_message})

        # 3. OpenAI API 호출
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",  # 원하는 모델을 선택하세요
            messages=current_messages,
            temperature=0.7,
            max_tokens=500
        )

        # 4. 챗봇 응답 추출 및 맥락에 저장
        bot_response = completion.choices[0].message.content
        current_messages.append({"role": "assistant", "content": bot_response})

        # 5. 결과 반환
        return jsonify({"response": bot_response})

    except Exception as e:
        # 오류 발생 시 디버깅을 위해 콘솔에 출력
        print(f"오류 발생: {e}")
        return jsonify({"error": "서버 처리 중 오류가 발생했습니다."}), 500

if __name__ == '__main__':
    # Flask 개발 서버 실행
    app.run(debug=True, port=5000)