# Parameterized Prompts Feature (v1.1)

## Overview

Version 1.1 introduces parameterized prompts, allowing you to define variable placeholders in your prompt templates. Users can fill in these variables through a dynamic form when invoking the prompt.

## Syntax

### Required Variables
```
[variable_name]
```
- Wrapped in square brackets
- User must fill this field
- Marked with red asterisk `*` in the form

### Optional Variables
```
[?variable_name]
```
- Wrapped in square brackets with `?` prefix
- User can leave empty
- Replaced with "无" (None) when empty
- Marked with gray "(选填)" (optional) text in the form

## Quick Example

**Prompt Template:**
```
Please review the following code:

Programming Language: [language]
Code Purpose: [?purpose]
Focus Areas: [?focus_areas]

Code:
[code_content]

Please provide feedback on:
1. Code quality and readability
2. Potential bugs and security issues
3. Performance optimization suggestions
4. Best practice recommendations
```

**User Experience:**
1. Click the prompt
2. Form appears with 4 input fields:
   - ⭐ language (required)
   - purpose (optional)
   - focus_areas (optional)
   - ⭐ code_content (required)
3. Fill required fields, optionally fill others
4. Click "Confirm and Fill"
5. Complete prompt is injected into AI chat

## Key Features

- **Backward Compatible**: Prompts without variables work as before (direct fill)
- **Smart Validation**: Required fields must be filled before submission
- **Flexible**: Mix required and optional variables as needed
- **User-Friendly**: Clear visual indicators for required/optional fields

## Implementation Details

### Variable Parsing
```javascript
// Regex pattern: /\[(\??[^\]]+)\]/g
// Matches: [var] and [?var]

{
  placeholder: "[?purpose]",  // Original placeholder
  name: "purpose",            // Display name
  required: false             // Is required?
}
```

### Variable Replacement
```javascript
// With value: direct replacement
content.replace("[variable]", "user_input");

// Optional empty: replace with "无"
content.replace("[?variable]", "无");
```

## Best Practices

1. **Keep variable names clear and concise**
2. **Use required for essential information only**
3. **Limit to 5-6 variables per prompt**
4. **Place most important fields first**

## Testing

See `test-parameterized-prompt.html` for comprehensive test cases and examples.

---

**Version:** 1.1.0  
**Release Date:** March 2024
