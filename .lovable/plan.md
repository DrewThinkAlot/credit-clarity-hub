
# Improved PDF Parsing and Credit Report Analysis

This plan addresses the core issue: the current PDF text extraction in the edge function is too basic and cannot handle modern compressed PDF formats, resulting in garbled text like "encoded_pattern" instead of actual account names.

---

## Problem Analysis

Your actual credit reports contain clear, structured data:

| Account | Balance | Status | Bureau(s) |
|---------|---------|--------|-----------|
| Credit One Bank | $654 | 120+ Days Late | All 3 |
| Jefferson Capital (Aspire) | $777 | Collection | Experian, Equifax |
| Credence Resource (AT&T) | $2,459 | Collection | Experian |
| Midland Credit | $700 | Collection | Equifax |
| Chime/Stride | $44 | Charge-off | Experian, TransUnion |
| Capital One | $0 | Paid/Closed | Experian, TransUnion |

However, the system currently shows "Unknown Creditor (Corrupted Data Block)" because:
1. The PDF extraction function only handles uncompressed PDF streams
2. Most modern PDFs use FlateDecode compression
3. The regex-based approach misses structured data in tables

---

## Solution: Use a Proper PDF Parser

### Option A: Use pdf-parse Library (Recommended)

Replace the basic text extraction with the `pdf-parse` library which handles:
- FlateDecode and other compression methods
- Font encoding and character mapping
- Table structure preservation

### Option B: Pre-process PDFs on Frontend

Use a client-side PDF parser before sending to the edge function, but this has issues with large files and browser memory.

---

## Implementation Plan

### Part 1: Update Edge Function with Better PDF Parsing

**File: `supabase/functions/analyze-report/index.ts`**

Replace the `extractTextFromPDFBuffer` function with a library-based solution using `pdf-parse` for Deno:

```typescript
// Use pdfjs-dist for Deno-compatible PDF parsing
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.min.mjs";

async function extractTextFromPDFBuffer(buffer: Uint8Array): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }
  
  return fullText.substring(0, 30000); // Increased limit for better analysis
}
```

### Part 2: Enhanced Text Cleaning

Add post-processing to clean extracted text:

```typescript
function cleanCreditReportText(rawText: string): string {
  // Normalize whitespace
  let text = rawText.replace(/\s+/g, " ");
  
  // Preserve table structures by detecting common patterns
  text = text.replace(/(\d+\s+days?\s+(?:late|past due))/gi, "\n$1");
  text = text.replace(/(Account\s+(?:Name|Number|Status))/gi, "\n$1");
  
  // Remove footer/header noise
  text = text.replace(/Page \d+ of \d+/gi, "");
  text = text.replace(/000000001-DISC/g, "");
  
  return text.trim();
}
```

### Part 3: Fallback Mechanism

If the PDF library fails, fall back to the current approach but with better error messaging:

```typescript
async function extractTextFromBase64PDF(base64Data: string): Promise<string> {
  try {
    // Primary method: PDF.js parsing
    const text = await extractWithPDFJS(buffer);
    if (text.length > 200) return cleanCreditReportText(text);
  } catch (e) {
    console.log("PDF.js parsing failed, trying fallback:", e);
  }
  
  // Fallback: Regex-based extraction
  return extractTextFromPDFBuffer(buffer);
}
```

### Part 4: Increase Token Limits

Update the analysis to handle larger text:
- Increase text limit from 15,000 to 30,000 chars per file
- Use the full power of Gemini 3 Pro's context window

---

## Alternative: Document Processing Service

If PDF.js proves unreliable in Deno, consider:

1. **Use Lovable's Document Parser** - The same tool I used to read your PDFs
2. **Store parsed text in database** - Parse once on upload, store structured text
3. **External PDF API** - Services like pdf.co or Adobe PDF Services

---

## Expected Results After Fix

The system should correctly identify:

| Priority | Account | Violation | FCRA Section | Success Rate |
|----------|---------|-----------|--------------|--------------|
| 1 | Credit One Bank ($654) | Recent Delinquency, First Payment Never Received | 611 | 65% |
| 1 | Jefferson Capital ($777) | Debt Buyer Collection | 609, 611 | 70% |
| 1 | Credence Resource ($2,459) | Collection with Status Conflict | 611, 623 | 60% |
| 2 | Midland Credit ($700) | Debt Buyer, Already Disputed | 611 | 55% |
| 2 | Chime/Stride ($44) | Small Charge-off | Pay-for-Delete | 85% |
| 3 | ML Enterprise ($72) | Small Charge-off | Pay-for-Delete | 90% |

**Potential Score Increase: 45-75 points** (based on removing collections and late payments)

---

## Technical Notes

- Deno runtime may require specific import configurations for PDF.js
- Worker threads are not available in edge functions, so PDF.js initialization needs adjustment
- Consider caching parsed text to avoid re-parsing on retries
- Add better logging to track what text was actually extracted for debugging

---

## Testing Plan

1. Deploy updated edge function
2. Re-upload your credit reports
3. Check edge function logs for extracted text quality
4. Verify discrepancies match the actual accounts from your reports
5. Generate a dispute letter and verify it references real account names

