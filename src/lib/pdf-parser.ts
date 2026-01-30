import * as pdfjsLib from "pdfjs-dist";

// Set the worker source for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Clean extracted text to improve AI analysis quality
 */
function cleanCreditReportText(rawText: string): string {
  let text = rawText;
  
  // Normalize whitespace while preserving some structure
  text = text.replace(/\s+/g, " ");
  
  // Add line breaks before common credit report section headers
  const sectionHeaders = [
    /(?=Account\s+(?:Name|Number|Status|Type))/gi,
    /(?=Payment\s+History)/gi,
    /(?=Balance\s+Information)/gi,
    /(?=Credit\s+Limit)/gi,
    /(?=Date\s+Opened)/gi,
    /(?=Last\s+(?:Payment|Activity))/gi,
    /(?=Account\s+Details)/gi,
    /(?=CREDIT\s+(?:ACCOUNTS|CARDS|HISTORY))/gi,
    /(?=COLLECTIONS)/gi,
    /(?=PUBLIC\s+RECORDS)/gi,
    /(?=INQUIRIES)/gi,
  ];
  
  for (const pattern of sectionHeaders) {
    text = text.replace(pattern, "\n");
  }
  
  // Preserve delinquency status visibility
  text = text.replace(/(\d+\s+days?\s+(?:late|past due|delinquent))/gi, "\n$1");
  
  // Remove common footer/header noise
  text = text.replace(/Page \d+ of \d+/gi, "");
  text = text.replace(/000000001-DISC/g, "");
  text = text.replace(/TransUnion Interactive/gi, "TransUnion");
  text = text.replace(/Experian Consumer Services/gi, "Experian");
  
  // Highlight collection accounts
  text = text.replace(/(Collection|Charge[\s-]?off|Charged Off)/gi, "\n[NEGATIVE] $1");
  
  // Clean up multiple newlines
  text = text.replace(/\n+/g, "\n");
  
  return text.trim();
}

/**
 * Parse PDF file and extract text content using pdfjs-dist
 * Runs entirely in the browser - no server round-trip needed
 */
export async function parsePdfText(file: File): Promise<string> {
  try {
    console.log(`[PDF Parser] Starting extraction for: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    console.log(`[PDF Parser] Loaded PDF with ${pdf.numPages} pages`);
    
    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 50); // Limit to first 50 pages

    // Iterate over all pages
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text items and add spacing
      const pageText = textContent.items
        .map((item: any) => {
          const str = item.str || "";
          // Add newline for items that appear to be on different lines
          if (item.hasEOL) return str + "\n";
          return str;
        })
        .join(" ");
        
      fullText += `--- PAGE ${i} ---\n${pageText}\n\n`;
    }
    
    // Clean the extracted text
    const cleanedText = cleanCreditReportText(fullText);
    
    console.log(`[PDF Parser] Extracted ${cleanedText.length} characters from ${maxPages} pages`);
    
    // Truncate to avoid overwhelming the AI
    if (cleanedText.length > 30000) {
      return cleanedText.substring(0, 30000) + "\n[... content truncated for analysis ...]";
    }
    
    return cleanedText;
  } catch (error) {
    console.error("[PDF Parser] Error parsing PDF:", error);
    throw new Error(`Failed to extract text from ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
