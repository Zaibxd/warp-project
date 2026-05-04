"""
In-process pub/sub for order events (SSE). Suitable for single-worker dev;
for multiple workers, replace with Redis pub/sub.
"""

from __future__ import annotations

import json
import queue
import threading
from typing import Any

_lock = threading.Lock()
_customer_queues: dict[int, list[queue.Queue]] = {}
_admin_queues: list[queue.Queue] = []


def _format_status(status: str) -> str:
    return status.replace("_", " ") if status else ""


def subscribe(user) -> queue.Queue:
    q: queue.Queue = queue.Queue(maxsize=100)
    with _lock:
        _customer_queues.setdefault(user.id, []).append(q)
        if user.is_staff:
            _admin_queues.append(q)
    return q


def unsubscribe(user, q: queue.Queue) -> None:
    with _lock:
        lst = _customer_queues.get(user.id)
        if lst and q in lst:
            lst.remove(q)
            if not lst:
                del _customer_queues[user.id]
        if user.is_staff and q in _admin_queues:
            _admin_queues.remove(q)


def _put_all(targets: list[queue.Queue], payload: dict[str, Any]) -> None:
    data = json.dumps(payload)
    sse = f"data: {data}\n\n"
    for q in targets:
        try:
            q.put_nowait(sse)
        except queue.Full:
            try:
                q.get_nowait()
            except queue.Empty:
                pass
            try:
                q.put_nowait(sse)
            except queue.Full:
                pass


def publish_order_status(user_id: int, order_id: int, status: str) -> None:
    message = f"Order #{order_id} updated to {_format_status(status)}."
    payload = {
        "kind": "order_status",
        "order_id": order_id,
        "status": status,
        "message": message,
    }
    with _lock:
        targets = list(_customer_queues.get(user_id, []))
    _put_all(targets, payload)


def publish_orders_changed() -> None:
    payload = {"kind": "orders_changed"}
    with _lock:
        targets = list(_admin_queues)
    _put_all(targets, payload)
