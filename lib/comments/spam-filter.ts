const SPAM_KEYWORDS = [
  'viagra', 'casino', 'crypto', 'bitcoin', 'investment', 
  'loan', 'debt', 'credit', 'mortgage', 'insurance'
];

const LINK_REGEX = /https?:\/\/[^\s]+/gi;

export function detectSpam(content: string): boolean {
  const lowerContent = content.toLowerCase();
  
  // Check for spam keywords
  const hasSpamKeywords = SPAM_KEYWORDS.some(keyword => 
    lowerContent.includes(keyword)
  );
  
  // Check for excessive links
  const links = content.match(LINK_REGEX) || [];
  const hasTooManyLinks = links.length > 2;
  
  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g)?.length || 0) / content.length;
  const hasExcessiveCaps = capsRatio > 0.7 && content.length > 10;
  
  return hasSpamKeywords || hasTooManyLinks || hasExcessiveCaps;
}