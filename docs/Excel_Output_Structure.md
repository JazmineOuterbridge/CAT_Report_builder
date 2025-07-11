# Excel Output Structure Documentation

## Overview

The CAT Report Builder generates Excel files with two sheets: "Notes" and "Data Comparison". The file is named `Notes_[YYYYMMDD].xlsx` and contains comprehensive analysis data.

## Sheet 1: Notes

### Structure
```
A1: Analysis Notes
A3: Main Driving Peril: [Peril Name]
A4: AAL % Change: [+/-X.X%]
A6: Exposure Change Analysis: [Description]
A8: Database Information:
A9: Current Year: [Database List]
A10: Previous Year: [Database List]
A11: Broker Current Year: [Database List]
A12: Broker Previous Year: [Database List]
A14: Reinsurance Details: [Details]
A16: Additional Notes: [Blank for manual input]
```

### Example Content
```
Analysis Notes

Main Driving Peril: Hurricane
AAL % Change: +12.5%

Exposure Change Analysis: Total TIV increased by 15.2% compared to previous year.

Database Information:
Current Year: 2025_Cat_Data1 (v6.1), 2025_Cat_Data2 (v6.1)
Previous Year: 2024_Cat_Data1 (v6.0)
Broker Current Year: Broker_2025_A (v6.1), Broker_2025_B (v6.1)
Broker Previous Year: Broker_2024_A (v6.0)

Reinsurance Details: 50% quota share on hurricane (2025, DB1), 40% on earthquake (2025, DB1)

Additional Notes:
[Blank section for manual input]
```

## Sheet 2: Data Comparison

### Structure by Peril

For each peril (Hurricane, Earthquake, Flood, Tornado), the sheet contains:

#### Company Results Section
```
[Peril Name] - Company Results
Metric          Current Year    Previous Year    % Change
AAL            $15,000,000     $13,500,000     +11.1%
TIV            $500,000,000    $450,000,000    +11.1%
```

#### Broker Results Section (if available)
```
[Peril Name] - Broker Results
Metric          Current Year    Previous Year    % Change
AAL            $14,250,000     $12,825,000     +11.1%
TIV            $475,000,000    $427,500,000    +11.1%
```

#### Company vs. Broker Section (if available)
```
[Peril Name] - Company vs. Broker
Metric          Company         Broker          Difference
AAL            $15,000,000     $14,250,000     +5.3%
TIV            $500,000,000    $475,000,000    +5.3%
```

### Complete Example Structure

```
Peril Data Comparison

Hurricane - Company Results
Metric          Current Year    Previous Year    % Change
AAL            $15,000,000     $13,500,000     +11.1%
TIV            $500,000,000    $450,000,000    +11.1%

Hurricane - Broker Results
Metric          Current Year    Previous Year    % Change
AAL            $14,250,000     $12,825,000     +11.1%
TIV            $475,000,000    $427,500,000    +11.1%

Hurricane - Company vs. Broker
Metric          Company         Broker          Difference
AAL            $15,000,000     $14,250,000     +5.3%
TIV            $500,000,000    $475,000,000    +5.3%

Earthquake - Company Results
Metric          Current Year    Previous Year    % Change
AAL            $8,000,000      $7,200,000      +11.1%
TIV            $300,000,000    $270,000,000    +11.1%

[Additional perils follow same pattern...]
```

## Formatting Details

### Currency Formatting
- All monetary values use US Dollar format
- No decimal places for whole dollar amounts
- Example: $15,000,000

### Percentage Formatting
- Positive percentages show "+" prefix
- Negative percentages show "-" prefix
- One decimal place precision
- Example: +11.1%, -5.3%

### Conditional Formatting
- Percentage changes ≥10% are highlighted in red
- High-risk indicators for significant changes
- Visual emphasis on driving peril data

### Table Styling
- Professional borders and shading
- Clear column headers
- Alternating row colors for readability
- Bold formatting for section headers

## File Naming Convention

Files are named using the pattern: `Notes_[YYYYMMDD].xlsx`

Examples:
- `Notes_20250708.xlsx` (July 8, 2025)
- `Notes_20241215.xlsx` (December 15, 2024)

## Data Aggregation Rules

### Multiple Database Handling
- AAL values are summed across databases
- TIV values are summed across databases
- EP curves are averaged across databases
- Database versions are listed for each database

### Percentage Calculations
- AAL % Change: `(Current - Previous) / Previous * 100`
- TIV % Change: `(Current - Previous) / Previous * 100`
- Company vs Broker: `(Company - Broker) / Broker * 100`

### Driving Peril Logic
- Peril with highest aggregated AAL is identified as driving peril
- Used for focus in Notes sheet
- Primary metric for analysis summary

## Error Handling

### Missing Data
- Previous year data: Shows "N/A" in Previous Year columns
- Broker data: Omits broker comparison sections
- Single database: Generates report with current year only

### Invalid Data
- Graceful handling of API errors
- Clear error messages in Notes sheet
- Fallback to available data

## Security Considerations

### Data Protection
- No sensitive data in file names
- Timestamp-based naming for uniqueness
- Client-side generation for privacy

### SharePoint Integration
- Uses SharePoint authentication
- Secure API token handling
- Azure AD integration for API access 