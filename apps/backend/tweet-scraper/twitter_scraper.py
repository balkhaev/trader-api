import asyncio
from twikit import Client
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import traceback

USERNAME = 'balkhaev'
EMAIL = 'm.balkhaev@gmail.com'
PASSWORD = '<fkm[ftdVb[fbk13'

# Initialize client
client = Client('en-US')

# Глобальная переменная для отслеживания статуса логина
_logged_in = False

def safe_datetime_to_iso(dt_obj) -> Optional[str]:
    """Безопасно преобразует datetime объект или строку в ISO формат"""
    if dt_obj is None:
        return None
    
    # Если это уже строка, возвращаем как есть
    if isinstance(dt_obj, str):
        return dt_obj
    
    # Если это datetime объект, вызываем isoformat
    if hasattr(dt_obj, 'isoformat'):
        return dt_obj.isoformat()
    
    # В остальных случаях пытаемся преобразовать в строку
    return str(dt_obj)

async def ensure_logged_in():
    """Убеждаемся, что клиент залогинен"""
    global _logged_in
    if not _logged_in:
        try:
            await client.login(
                auth_info_1=USERNAME,
                auth_info_2=EMAIL,
                password=PASSWORD,
                cookies_file='cookies.json'
            )
            _logged_in = True
        except Exception as e:
            print(f"Ошибка логина: {e}")
            raise

def build_query(query: str, since: Optional[str] = None, until: Optional[str] = None, lang: Optional[str] = None) -> str:
    """Строит поисковый запрос для Twitter API"""
    search_query = query
    
    if since:
        search_query += f" since:{since}"
    if until:
        search_query += f" until:{until}"
    if lang:
        search_query += f" lang:{lang}"
    
    return search_query

async def scrape_tweets_async(query: str, limit: Optional[int] = 100) -> List[Dict[str, Any]]:
    """Скрапит твиты по запросу (асинхронная версия)"""
    await ensure_logged_in()
    
    try:
        # Поиск твитов
        tweets = await client.search_tweet(query, product='Latest')
        
        results = []
        count = 0
        
        for tweet in tweets:
            if limit and count >= limit:
                break
            
            try:
                tweet_data = {
                    'id': tweet.id,
                    'text': tweet.text,
                    'created_at': safe_datetime_to_iso(tweet.created_at),
                    'user': {
                        'id': tweet.user.id if tweet.user else None,
                        'screen_name': tweet.user.screen_name if tweet.user else None,
                        'name': tweet.user.name if tweet.user else None,
                    },
                    'retweet_count': getattr(tweet, 'retweet_count', 0),
                    'favorite_count': getattr(tweet, 'favorite_count', 0),
                    'reply_count': getattr(tweet, 'reply_count', 0),
                    'lang': getattr(tweet, 'lang', None),
                }
                
                results.append(tweet_data)
                count += 1
            except Exception as tweet_error:
                print(f"Ошибка при обработке твита: {tweet_error}")
                print(f"Traceback: {traceback.format_exc()}")
                print(f"Tweet created_at type: {type(tweet.created_at)}")
                print(f"Tweet created_at value: {tweet.created_at}")
                # Пропускаем проблемный твит и продолжаем
                continue
            
        return results
        
    except Exception as e:
        print(f"Ошибка при скрапинге твитов: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise

async def get_user_tweets_async(username: str, limit: Optional[int] = 100) -> List[Dict[str, Any]]:
    """Получает твиты пользователя по username (асинхронная версия)"""
    await client.login(
        auth_info_1=USERNAME,
        auth_info_2=EMAIL,
        password=PASSWORD,
        cookies_file='cookies.json'
    )
    
    try:
        user = await client.get_user_by_screen_name(username)
        tweets = await client.get_user_tweets(user.id, 'Tweets')
        
        results = []
        count = 0
        
        for tweet in tweets:
            if limit and count >= limit:
                break
                
            tweet_data = {
                'id': tweet.id,
                'text': tweet.text,
                'created_at': safe_datetime_to_iso(tweet.created_at),
                'user': {
                    'id': tweet.user.id if tweet.user else None,
                    'screen_name': tweet.user.screen_name if tweet.user else None,
                    'name': tweet.user.name if tweet.user else None,
                },
                'retweet_count': getattr(tweet, 'retweet_count', 0),
                'favorite_count': getattr(tweet, 'favorite_count', 0),
                'reply_count': getattr(tweet, 'reply_count', 0),
                'lang': getattr(tweet, 'lang', None),
            }
            
            results.append(tweet_data)
            count += 1
            
        return results
        
    except Exception as e:
        print(f"Ошибка при получении твитов пользователя: {e}")
        raise

# Синхронная функция для использования в main.py
def scrape_tweets(query: str, limit: Optional[int] = 100):
    """Генератор для совместимости с существующим кодом в main.py"""
    try:
        results = asyncio.run(scrape_tweets_async(query, limit))
        for tweet in results:
            yield tweet
    except Exception as e:
        print(f"Ошибка в scrape_tweets: {e}")
        raise

def get_user_tweets(username: str, limit: Optional[int] = 100):
    """Синхронная обертка для get_user_tweets"""
    try:
        results = asyncio.run(get_user_tweets_async(username, limit))
        for tweet in results:
            yield tweet
    except Exception as e:
        print(f"Ошибка в get_user_tweets: {e}")
        raise

async def main():
    """Основная функция для тестирования"""
    await ensure_logged_in()
    
    user = await client.get_user_by_screen_name('elonmusk')
    tweets = await client.get_user_tweets(user.id, 'Tweets')

    for tweet in tweets:
        print(tweet.text)

if __name__ == "__main__":
    asyncio.run(main())
