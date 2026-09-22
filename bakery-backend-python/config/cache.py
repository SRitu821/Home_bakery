import os
import time
import json
import logging
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("cache")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# In-memory fallback cache with TTL support
_memory_cache: dict[str, dict[str, Any]] = {}


def _mem_get(key: str) -> Optional[Any]:
    item = _memory_cache.get(key)
    if not item:
        return None
    if time.time() > item["expires_at"]:
        _memory_cache.pop(key, None)
        return None
    return item["value"]


def _mem_set(key: str, value: Any, ttl_seconds: int = 600) -> None:
    _memory_cache[key] = {
        "value": value,
        "expires_at": time.time() + ttl_seconds,
    }


def _mem_del(key: str) -> None:
    _memory_cache.pop(key, None)


class CacheClient:
    def __init__(self, url: str):
        self.url = url
        self._redis = None
        self._is_redis_connected = False
        self._init_client()

    def _init_client(self):
        try:
            import redis
            self._redis = redis.Redis.from_url(
                self.url,
                decode_responses=True,
                socket_connect_timeout=3,
                socket_timeout=3,
                retry_on_timeout=False,
            )
            # Test connectivity
            self._redis.ping()
            self._is_redis_connected = True
            logger.info("[Cache] Connected to Redis database!")
        except Exception as err:
            self._is_redis_connected = False
            logger.info(f"[Cache] Redis server unavailable ({err}). Using in-memory fallback.")

    def is_redis_ready(self) -> bool:
        if not self._is_redis_connected or not self._redis:
            return False
        try:
            return bool(self._redis.ping())
        except Exception:
            self._is_redis_connected = False
            return False

    def get(self, key: str) -> Optional[Any]:
        if self._is_redis_connected and self._redis:
            try:
                data = self._redis.get(key)
                return json.loads(data) if data is not None else None
            except Exception as err:
                logger.warning(f"[Cache] Redis GET failed for key '{key}', falling back to memory: {err}")
                self._is_redis_connected = False
        return _mem_get(key)

    def set(self, key: str, value: Any, ttl_seconds: int = 600) -> None:
        if self._is_redis_connected and self._redis:
            try:
                serialized = json.dumps(value, default=str)
                self._redis.setex(key, ttl_seconds, serialized)
                return
            except Exception as err:
                logger.warning(f"[Cache] Redis SET failed for key '{key}', falling back to memory: {err}")
                self._is_redis_connected = False
        _mem_set(key, value, ttl_seconds)

    def delete(self, key: str) -> None:
        if self._is_redis_connected and self._redis:
            try:
                self._redis.delete(key)
            except Exception as err:
                logger.warning(f"[Cache] Redis DEL failed for key '{key}': {err}")
                self._is_redis_connected = False
        _mem_del(key)

    # Alias matching node.js cache.del(key)
    def del_key(self, key: str) -> None:
        self.delete(key)

    def disconnect(self) -> None:
        if self._redis:
            try:
                self._redis.close()
            except Exception:
                pass


cache = CacheClient(REDIS_URL)
