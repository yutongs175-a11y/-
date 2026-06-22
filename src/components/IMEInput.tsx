import { useRef, useState, useEffect } from 'react';

/**
 * 解决 React 受控组件与中文输入法（IME）冲突的问题
 *
 * 方案：
 * - 内部维护 localValue，组字期间自由编辑，不阻塞输入法
 * - 组字结束后（onCompositionEnd）主动把 DOM 最新值通过 onValueChange 回调通知父组件
 * - 父组件通过 onValueChange 接收纯字符串，无需处理 React ChangeEvent
 */

export function IMETextarea({
  value,
  onValueChange,
  className,
  ...props
}: {
  value: string;
  onValueChange?: (value: string) => void;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>) {
  const [localValue, setLocalValue] = useState(value || '');
  const composing = useRef(false);
  const elRef = useRef<HTMLTextAreaElement>(null);

  // 外部 value 变化时同步（非组字状态下）
  useEffect(() => {
    if (!composing.current) {
      setLocalValue(value || '');
    }
  }, [value]);

  const syncToParent = () => {
    const el = elRef.current;
    if (el && onValueChange) {
      onValueChange(el.value);
    }
  };

  return (
    <textarea
      ref={elRef}
      value={localValue}
      onChange={(e) => {
        const v = e.target.value;
        setLocalValue(v);
        // 非组字状态直接同步
        if (!composing.current) {
          onValueChange?.(v);
        }
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
        // 组字结束后主动同步 DOM 最新值给父组件
        queueMicrotask(syncToParent);
      }}
      className={className}
      {...props}
    />
  );
}

export function IMEInput({
  value,
  onValueChange,
  className,
  ...props
}: {
  value: string;
  onValueChange?: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [localValue, setLocalValue] = useState(value || '');
  const composing = useRef(false);
  const elRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!composing.current) {
      setLocalValue(value || '');
    }
  }, [value]);

  const syncToParent = () => {
    const el = elRef.current;
    if (el && onValueChange) {
      onValueChange(el.value);
    }
  };

  return (
    <input
      ref={elRef}
      value={localValue}
      onChange={(e) => {
        const v = e.target.value;
        setLocalValue(v);
        if (!composing.current) {
          onValueChange?.(v);
        }
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
        queueMicrotask(syncToParent);
      }}
      className={className}
      {...props}
    />
  );
}
