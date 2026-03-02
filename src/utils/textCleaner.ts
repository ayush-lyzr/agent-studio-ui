export const cleanEventText = (text: string): string => {
  if (!text) return text;

  // Remove <EXECUTION_COMPLETE> tags
  return text.replace(/<EXECUTION_COMPLETE>/g, "");
};
