import { useRef, useState } from 'react';

/**
 * 解决 React 受控组件与中文输入法（IME）冲突的问题
 *
 * 原理：
 * - 组字期间（compositioning）屏蔽 onChange，不让 React 状态更新
 *   React 不会重渲染，DOM 值不会被重置，输入法正常工作
 * - 组字结束后浏览器会自然触发 input 事件，
 *   React 的 onChange 会响应，此时 composing=false，正常同步状态
 */

export function IMETextarea({
  value,
  onChange,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const composing = useRef(false);

  return (
    <textarea
      value={value}
      onChange={(e) => {
        // 组字期间不触发 onChange，避免打断输入法
        if (!composing.current) {
          onChange?.(e);
        }
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        // 组字结束：先标记，让后续的 onChange 能通过
        composing.current = false;
        // 浏览器会在 onCompositionEnd 之后自然触发 onInput/onChange，
        // 无需手动触发，避免重复/错误事件
      }}
      {...props}
    />
  );
}

export function IMEInput({
  value,
  onChange,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const composing = useRef(false);

  return (
    <input
      value={value}
      onChange={(e) => {
        if (!composing.current) {
          onChange?.(e);
        }
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
      }}
      {...props}
    />
  );
}
