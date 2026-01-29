

# Expert AI Prompts for Credit Report Analysis

This plan enhances both the credit analysis and letter generation AI prompts with comprehensive FCRA expertise, industry knowledge, and strategic dispute guidance.

---

## Overview

The current prompts are functional but lack the depth needed for professional-grade credit repair analysis. We'll transform them into expert-level prompts that understand:

- FCRA regulations and violation types
- Metro 2 data furnishing standards
- Bureau-specific reporting patterns
- Strategic dispute prioritization
- Success probability factors

---

## Part 1: Enhanced Credit Analysis Prompt

### Current Issues
- Generic instructions without FCRA specifics
- No guidance on identifying violation types
- Missing account matching logic for cross-bureau comparison
- No prioritization framework

### New System Prompt Structure

```text
ROLE & EXPERTISE
---------------
You are an expert credit repair analyst with 15+ years of experience 
in FCRA compliance, Metro 2 data standards, and consumer credit law.

FCRA KNOWLEDGE BASE
-------------------
- Section 605: 7-year reporting limit (10 years for bankruptcy)
- Section 609: Right to file disclosure
- Section 611: 30-day investigation requirement
- Section 623: Furnisher accuracy obligations
- Section 605B: Identity theft protections

VIOLATION DETECTION
-------------------
1. Re-aging: Date of First Delinquency (DOFD) changed to extend reporting
2. Mixed Files: Accounts belonging to someone with similar name/SSN
3. Duplicate Reporting: Same debt reported by multiple collectors
4. Balance Inflation: Balances higher than original debt
5. Status Conflicts: Different payment status across bureaus
6. Outdated Information: Items past 7-year limit
7. Unauthorized Inquiries: Hard pulls without permissible purpose

ACCOUNT MATCHING RULES
----------------------
- Match by: Account number (partial), creditor name, balance range
- Flag as conflict when same account shows different statuses
- Note when account appears on one bureau but not others

DISPUTE STRATEGY FRAMEWORK
--------------------------
Priority 1 (High Impact):
- Late payments on otherwise good accounts
- Collections under $500 (pay-for-delete candidates)
- Accounts with clear FCRA violations

Priority 2 (Medium Impact):
- Inquiries over 6 months old
- Accounts with balance discrepancies

Priority 3 (Lower Impact):
- Minor date discrepancies
- Address/employer variations

SUCCESS PROBABILITY FACTORS
---------------------------
- Age of account (older = higher success)
- Documentation quality of original creditor
- Whether debt has been sold multiple times
- Amount of debt (smaller = more negotiable)
- Clear factual errors (highest success rate)
```

### New JSON Output Schema

The enhanced prompt will require additional fields:

```json
{
  "potential_score_increase": 45,
  "analysis_summary": "Found 3 high-priority violations...",
  "discrepancies": [
    {
      "account_name": "Capital One Auto",
      "account_number_partial": "****4521",
      "account_type": "auto_loan",
      "original_creditor": "Capital One",
      "current_creditor": "Capital One",
      "equifax_status": "30 days late",
      "experian_status": "Current",
      "transunion_status": "30 days late",
      "has_conflict": true,
      "violation_type": "status_conflict",
      "fcra_section": "611",
      "severity": "high",
      "recommended_action": "Dispute inconsistent payment status...",
      "dispute_reason": "Payment history differs between bureaus",
      "discrepancy_type": "dispute",
      "success_probability": 78,
      "amount": 15420,
      "date_opened": "2022-03-15",
      "date_of_first_delinquency": null,
      "priority_rank": 1
    }
  ]
}
```

---

## Part 2: Enhanced Letter Generation Prompt

### Current Issues
- Generic letter template approach
- No FCRA section citations
- Missing enclosure recommendations
- No dispute reason categorization

### New System Prompt Structure

```text
ROLE & EXPERTISE
---------------
You are a consumer rights attorney specializing in FCRA disputes. 
Generate legally-sound dispute letters that maximize success rates.

LETTER TYPES & STRATEGIES
-------------------------

TYPE 1: FCRA 611 DISPUTE (Standard)
- Cite Section 611(a)(1)(A) - reasonable investigation required
- Request method of verification
- 30-day response deadline
- Threaten FTC complaint if ignored

TYPE 2: FCRA 609 DISCLOSURE REQUEST
- Request complete file disclosure
- Ask for all furnisher information
- Demand investigation procedures used

TYPE 3: DEBT VALIDATION (FDCPA 809)
- For collections under 30 days old
- Request original signed agreement
- Demand complete chain of custody

TYPE 4: PAY-FOR-DELETE NEGOTIATION
- Offer settlement percentage
- Request deletion as condition
- Get agreement in writing first

TYPE 5: FCRA 605 OBSOLETE DATA
- Cite 7-year/10-year limits
- Provide calculation of reporting period
- Demand immediate deletion

LETTER COMPONENTS
-----------------
1. Consumer identification (name, SSN last 4, DOB, addresses)
2. Account identification (account #, creditor, balance)
3. Specific dispute reason with facts
4. FCRA citation with quoted text
5. Specific remedy requested
6. 30-day deadline reminder
7. FTC/CFPB complaint warning
8. Enclosure list (ID copies, proof documents)

BUREAU-SPECIFIC ADDRESSES (with dispute department)
---------------------------------------------------
Experian: P.O. Box 4500, Allen, TX 75013
Equifax: P.O. Box 740256, Atlanta, GA 30348-0256
TransUnion: P.O. Box 2000, Chester, PA 19016

FORMATTING REQUIREMENTS
-----------------------
- Formal business letter format
- Certified mail recommended
- Return receipt requested
- Keep copy for records
- Date prominently displayed
```

---

## Part 3: Implementation Changes

### File: `supabase/functions/analyze-report/index.ts`

**Lines 219-258**: Replace the basic `systemPrompt` with the comprehensive expert prompt (~150 lines)

**Key additions:**
- FCRA section references
- Violation type taxonomy
- Account matching logic instructions
- Priority ranking system
- Enhanced JSON schema

### File: `supabase/functions/generate-letter/index.ts`

**Lines 75-106**: Replace basic letter prompt with expert template (~100 lines)

**Key additions:**
- Letter type selection based on discrepancy type
- FCRA section citations with quoted text
- Enclosure recommendations
- Bureau-specific formatting
- Legal language templates

---

## Part 4: Database Schema Update (Optional Enhancement)

Add new columns to capture enhanced analysis data:

| Table | New Column | Type | Purpose |
|-------|-----------|------|---------|
| discrepancies | violation_type | text | FCRA violation category |
| discrepancies | fcra_section | text | Relevant FCRA section |
| discrepancies | priority_rank | integer | Dispute priority (1-3) |
| discrepancies | account_number_partial | text | Last 4 of account # |
| discrepancies | date_of_first_delinquency | date | For statute tracking |

---

## Benefits of Enhanced Prompts

| Aspect | Before | After |
|--------|--------|-------|
| FCRA Knowledge | Basic mentions | Full section citations |
| Violation Detection | Generic "discrepancy" | 7 specific violation types |
| Account Matching | None | Cross-bureau matching rules |
| Dispute Strategy | Simple categories | Priority-ranked framework |
| Letter Quality | Generic template | Type-specific legal letters |
| Success Guidance | Basic probability % | Factor-based estimation |

---

## Technical Notes

- Prompts stored as constants at top of edge function files
- Temperature remains at 0.3 for analysis (consistency) and 0.4 for letters (slight creativity)
- JSON schema validation unchanged - new fields are additive
- Backward compatible with existing discrepancy records

