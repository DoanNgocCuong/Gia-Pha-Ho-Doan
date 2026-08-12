# Architecture Spec v2.0: Master Family Tree OpenXML AST Compiler Engine

## 1. Executive Summary

The Master Family Tree OpenXML AST Compiler Engine v2.0 is designed to resolve the brittle regex-based and superficial text-parsing limitations of previous versions. It shifts the paradigm from "parsing Word text" to "compiling OpenXML AST (Abstract Syntax Tree)".

By treating the `.docx` file as a structured AST rather than a flat text file, the engine can deterministically resolve complex indentations, stylistic inheritance, and relational linkages without guessing.

## 2. Core Architecture: The 4-Pass Compilation Engine

The compilation process is divided into 4 distinct, immutable passes. Each pass consumes the output of the previous pass and produces a strictly typed intermediate representation (IR).

### Pass 1: Tokenize & Normalization Engine
**Objective:** Clean raw text, eliminate invisible corruptions, and standardize encoding.
*   **Operations:**
    *   **NFC Normalization:** Converts all Vietnamese strings to Unicode Normalization Form C (NFC) to prevent visual duplicates mapping to different byte sequences (e.g., `e` + `~` vs `ẽ`).
    *   **Zero-Width Stripper:** Removes zero-width spaces (`\u200B`), non-breaking spaces (`\u00A0`), BOMs, and other invisible characters that break strict string matching.
    *   **Punctuation Standardization:** Normalizes smart quotes, em-dashes, and multiple spaces into standard ASCII equivalents.
*   **Output:** `NormalizedParagraph[]` (Raw text + XML node reference).

### Pass 2: Style & NumPr Indent Inheritance Resolver Engine
**Objective:** Deterministically calculate the exact hierarchical depth (Generation Level) of every paragraph using OpenXML semantics.
*   **Operations:**
    *   **Direct XML Traversal:** Reads `word/document.xml` and `word/styles.xml` directly using `mammoth.js` (or raw XML parsers like `xmldom`).
    *   **pStyle Resolution:** Evaluates `<w:pStyle>` tags to resolve base indentations.
    *   **numPr/ilvl Evaluation:** Evaluates `<w:numPr>` (numbering properties) and `<w:ilvl>` (indent level) tags. This is the source of truth for list hierarchies.
    *   **Tab Resolution:** Calculates logical indent levels based on `<w:tabs>` or `<w:ind>` attributes when numbering is not used.
*   **Output:** `ASTNode[]` (Contains normalized text + absolute calculated depth `level`).

### Pass 3: Relational & Spouse Splitter Engine
**Objective:** Transform flat AST nodes into relational graphs, correctly separating consanguineous (blood) descendants from affinal (marriage) relations.
*   **Operations:**
    *   **Spouse Extraction:** Parses lines containing "+", "Chồng:", "Vợ:", or inline parenthesis logic. Separates the primary bloodline individual from their spouse(s).
    *   **Data Structure Shift:** Moves spouses into a `spouses: []` array on the main individual node, rather than treating them as siblings or children.
    *   **Multi-Child Line Splitter:** Handles cases where multiple children are listed on a single line (e.g., "1. Nguyễn Văn A, 2. Nguyễn Thị B"). Splits these into `N` distinct AST nodes at the same depth level.
*   **Output:** `RelationalNode[]` (Tree structure with `children[]` and `spouses[]`).

### Pass 4: Biological Safeguards & Immutable ID Tree Builder
**Objective:** Assign deterministic identities, enforce logical constraints, and finalize the JSON artifact.
*   **Operations:**
    *   **Deterministic ID Generation:** Generates UUIDs or deterministic hashes based on the node's path (e.g., `1.1.2.3_NguyenVanA`). This ensures stable IDs across re-compilations.
    *   **Biological Sanity Checks:**
        *   Checks for age impossibilities (e.g., parent born after child, or age gap < 12 years if dates are available).
        *   Detects duplicate spouses or circular relationships.
    *   **Honorific Lock:** Locks specific titles (Ông, Bà, Trưởng Tộc) as immutable tags to prevent them from being accidentally stripped or merged.
*   **Output:** Final `family_tree_v2.json` (Production-ready JSON API payload).

## 3. Technology Stack & Integration
*   **Parser:** Native XML parsing (`xmldom`, `xpath`) for absolute accuracy. Fallback to `mammoth.js` for raw text extraction.
*   **Engine Core:** TypeScript for strict typing of intermediate AST nodes.
*   **Testing:** Jest for unit testing every pass independently.

## 4. Conclusion
By adopting a compiler-driven, AST-based approach, the engine eliminates the fragility of regex and guarantees 100% deterministic parsing of complex Word documents, resolving the 20 critical flaws of the legacy parser.
