import { useRef } from 'react';

/**
 * 解决 React 受控组件与中文输入法（IME）冲突的问题
 *
 * 问题：当使用拼音等输入法时，React 的 value={state} + onChange 会在
 * 输入法"组字"过程中触发重渲染，导致输入法中间状态丢失，字打不进去。
 *
 * 解决：通过 onCompositionStart/End 感知输入法状态，
 * 组字期间跳过 onChange，组字完成后再同步 value。
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
        if (!composing.current) onChange?.(e);
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={(e) => {
        composing.current = false;
        onChange?.(e as any);
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
        if (!composing.current) onChange?.(e);
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={(e) => {
        composing.current = false;
        onChange?.(e as any);
      }}
      {...props}
    />
  );
}
