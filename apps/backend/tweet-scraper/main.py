import os, sys
sys.path.append(os.path.dirname(__file__))
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from twitter_scraper import build_query, scrape_tweets_async, get_user_tweets_async
from typing import List, Dict, Any
import uvicorn

app = FastAPI(title="Social Scrapper API", version="1.0.0")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/twitter/search", response_model=List[Dict[str, Any]])
async def twitter_search(
    query: str = Query(..., description="Строка поиска Twitter"),
    limit: int = Query(100, ge=0, le=500, description="Максимум твитов"),
    since: str | None = Query(None, description="Дата начала (YYYY-MM-DD)"),
    until: str | None = Query(None, description="Дата конца (YYYY-MM-DD)"),
    lang: str | None = Query(None, description="Код языка (ru/en/..)")
):
    """Поиск твитов по запросу"""
    try:
        q = build_query(query, since=since, until=until, lang=lang)
        tweets = await scrape_tweets_async(q, limit=limit if limit > 0 else None)
        
        return JSONResponse(content={
            "query": q,
            "count": len(tweets),
            "tweets": tweets
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при поиске твитов: {str(e)}")


@app.get("/twitter/user/{username}", response_model=List[Dict[str, Any]])
async def twitter_user_tweets(
    username: str,
    limit: int = Query(100, ge=1, le=500, description="Максимум твитов")
):
    """Получение твитов пользователя по username"""
    try:
        tweets = await get_user_tweets_async(username, limit=limit)
        
        return JSONResponse(content={
            "username": username,
            "count": len(tweets),
            "tweets": tweets
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении твитов пользователя {username}: {str(e)}")

def run():
    # Запуск из кода: python -m social_scrapper.main
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 3001)), reload=False)


if __name__ == "__main__":
    run() 
