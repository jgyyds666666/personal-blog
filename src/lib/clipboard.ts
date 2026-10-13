/** Copy in modern browsers, with a fallback for older mobile WebViews. */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const previousFocus = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    field.style.fontSize = '16px';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, text.length);
    try {
      if (!document.execCommand('copy')) throw new Error('复制失败');
    } finally {
      field.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
    }
  }
}
