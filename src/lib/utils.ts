export function httpError(
  status: number = 500,
  message: string = "",
  cause: any = undefined
) {
  // @ts-ignore-next-line
  const err = new Error(message, cause ? { cause } : {});
  return Object.assign(err, { status });
}

export function equalsIgnoreCase(a: string, b: string) {
  if (a == b) {
    return true;
  } else if (a == null || b == null) {
    return a == b;
  }
  return String(a).toUpperCase() === String(b).toUpperCase();
}
