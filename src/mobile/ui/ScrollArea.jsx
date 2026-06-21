// STP Mobile — scroll region with pull-to-refresh, ported from the prototype.
import React, { useState, useRef } from "react";
import Icon from "./Icon";

export default function ScrollArea({ children, onRefresh, scrollRef, onScroll, style }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const fallbackRef = useRef(null);
  const innerRef = scrollRef || fallbackRef;

  const onTouchStart = (e) => {
    if (innerRef.current && innerRef.current.scrollTop <= 0) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (startY.current == null || refreshing) return;
    const d = e.touches[0].clientY - startY.current;
    if (d > 0 && innerRef.current.scrollTop <= 0) setPull(Math.min(d * 0.5, 90));
  };
  const onTouchEnd = () => {
    if (pull > 60 && onRefresh) {
      setRefreshing(true);
      setPull(46);
      onRefresh(() => { setRefreshing(false); setPull(0); });
    } else {
      setPull(0);
    }
    startY.current = null;
  };

  return (
    <div
      ref={innerRef}
      className="app-scroll"
      onScroll={onScroll}
      onTouchStart={onRefresh ? onTouchStart : undefined}
      onTouchMove={onRefresh ? onTouchMove : undefined}
      onTouchEnd={onRefresh ? onTouchEnd : undefined}
      style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", position: "relative", ...style }}
    >
      {onRefresh && (
        <div style={{ height: pull, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: startY.current == null ? "height .25s" : "none" }}>
          <Icon name="refresh" size={20} color="var(--green)" stroke={2.2} style={{ animation: refreshing ? "stpm-spin 0.8s linear infinite" : "none", opacity: Math.min(pull / 50, 1), transform: `rotate(${pull * 3}deg)` }} />
        </div>
      )}
      {children}
    </div>
  );
}
