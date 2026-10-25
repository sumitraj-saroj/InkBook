/**
 * Inspects command line arguments and extracts any *.inkbook file path,
 * ignoring Electron flags and runtime switches.
 */
export function findInkBookArgument(argv: string[]): string | null {
  for (const arg of argv) {
    if (!arg || arg.startsWith('-')) {
      continue
    }
    // Match any argument ending in .inkbook
    if (arg.endsWith('.inkbook')) {
      return arg
    }
  }
  return null
}
